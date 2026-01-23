import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Initialize Supabase client with Service Role Key for secure backend operations
const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Webhooks do Mercado Pago podem enviar dados via query params OU corpo JSON
  const url = new URL(req.url);
  const topic = url.searchParams.get('topic');
  const idFromQuery = url.searchParams.get('id'); // ID da notificação ou do recurso (query)
  const type = url.searchParams.get('type'); // Alias para topic

  // Tentar também ler o corpo JSON (alguns webhooks do MP enviam data.id no body)
  let body: any = null;
  try {
    if (req.method !== 'OPTIONS') {
      body = await req.json().catch(() => null);
    }
  } catch {
    body = null;
  }

  const idFromBody = body?.data?.id || body?.id || null;
  const notificationType = topic || type || body?.type || body?.action || null;

  if (!notificationType) {
    return new Response(JSON.stringify({ error: 'Missing notification type' }), { status: 400, headers: corsHeaders });
  }
  
  // 1. Determinar o tipo de notificação e ID do recurso
  const resourceId = idFromQuery || idFromBody;

  if (notificationType !== 'payment' || !resourceId) {
    console.log(`[MP Webhook] Ignoring notification type: ${notificationType} or missing resource ID. Query id: ${idFromQuery}, Body id: ${idFromBody}`);
    return new Response(JSON.stringify({ message: 'Notification received, but ignored.' }), { status: 200, headers: corsHeaders });
  }

  try {
    // 2. Obter o access token do Mercado Pago das Secrets (PAYMENT_API_KEY_SECRET)
    const mpAccessTokenRaw = Deno.env.get('PAYMENT_API_KEY_SECRET');
    if (!mpAccessTokenRaw || mpAccessTokenRaw.trim() === '') {
        console.error('[MP Webhook] ERROR: PAYMENT_API_KEY_SECRET not set or empty.');
        return new Response(JSON.stringify({ error: 'Payment service not configured (missing PAYMENT_API_KEY_SECRET).' }), { status: 500, headers: corsHeaders });
    }
    const mpAccessToken = mpAccessTokenRaw.trim();
    console.log(`[MP Webhook] Access Token found (masked length: ${mpAccessToken.length})`);
    console.log(`[MP Webhook] Access Token starts with: ${mpAccessToken.substring(0, 10)}...`);

    // 3. Chamar a API do Mercado Pago para obter o status real do pagamento
    console.log(`[MP Webhook] Fetching payment details for resource ID: ${resourceId}`);
    const mpPaymentApiResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!mpPaymentApiResponse.ok) {
        const errorText = await mpPaymentApiResponse.text();
        console.error(`[MP Webhook] Mercado Pago API error fetching payment (${mpPaymentApiResponse.status}):`, errorText);
        return new Response(JSON.stringify({ error: 'Failed to fetch payment details from Mercado Pago.' }), { status: 500, headers: corsHeaders });
    }

    const mpPaymentData = await mpPaymentApiResponse.json();
    const paymentStatus = mpPaymentData.status; // Status real do pagamento
    console.log(`[MP Webhook] Payment status from Mercado Pago API: ${paymentStatus}`);
    console.log(`[MP Webhook] Mercado Pago Payment Data:`, JSON.stringify(mpPaymentData, null, 2));

    // 4. Usar o external_reference do pagamento para localizar a transação em 'receivables'
    // No create-payment-preference, definimos external_reference = transactionId (id do receivable)
    const externalReference = mpPaymentData.external_reference as string | null;
    if (!externalReference) {
        console.error('[MP Webhook] ERROR: Payment external_reference not found. Cannot link to receivables transaction.');
        return new Response(JSON.stringify({ error: 'Payment external_reference missing. Cannot link transaction.' }), { status: 500, headers: corsHeaders });
    }

    const transactionId = externalReference;

    // 5. Buscar a transação pendente na tabela 'receivables' usando o transactionId
    const { data: receivable, error: fetchReceivableError } = await supabaseService
        .from('receivables')
        .select('id, client_user_id, wristband_analytics_ids, manager_user_id, event_id, total_value')
        .eq('id', transactionId)
        .eq('status', 'pending')
        .single();

    if (fetchReceivableError || !receivable) {
        console.warn(`[MP Webhook] Pending receivable not found for transaction ID (external_reference): ${transactionId}`);
        return new Response(JSON.stringify({ message: 'Receivable not found or already processed.' }), { status: 200, headers: corsHeaders });
    }

    const clientUserId = receivable.client_user_id;
    const analyticsIds = receivable.wristband_analytics_ids;
    const managerUserId = receivable.manager_user_id;
    const eventId = receivable.event_id;
    const totalValue = receivable.total_value;

    // Validações adicionais para os novos campos
    if (!eventId || !totalValue) {
        console.error(`[MP Webhook] Critical Error: Receivable ${transactionId} missing event_id or total_value.`);
        return new Response(JSON.stringify({ error: 'Transaction data incomplete.' }), { status: 500, headers: corsHeaders });
    }

    
    if (paymentStatus === 'approved') {
        // 6. Atualizar status da transação para 'paid'
        const { error: updateReceivableError } = await supabaseService
            .from('receivables')
            .update({ status: 'paid' })
            .eq('id', transactionId);

        if (updateReceivableError) throw updateReceivableError;

        // 5. Buscar o percentual de comissão aplicado ao evento e company_id
        const { data: eventData, error: fetchEventError } = await supabaseService
            .from('events')
            .select('applied_percentage, company_id')
            .eq('id', eventId)
            .single();
        
        if (fetchEventError || !eventData) {
            console.error(`[MP Webhook] Critical Error: Event ${eventId} not found or missing applied_percentage.`, fetchEventError);
            throw new Error(`Event ${eventId} data incomplete for financial split.`);
        }

        const appliedPercentage = eventData.applied_percentage;
        const companyId = eventData.company_id;
        
        // Validação do percentual de comissão
        if (!appliedPercentage || appliedPercentage < 0 || appliedPercentage > 100) {
            console.error(`[MP Webhook] Critical Error: Invalid applied_percentage (${appliedPercentage}) for event ${eventId}.`);
            throw new Error(`Invalid commission percentage for event ${eventId}.`);
        }

        // 6. Calcular valores: comissão da plataforma e valor líquido do organizador
        const platformAmount = totalValue * (appliedPercentage / 100);
        const managerAmount = totalValue - platformAmount;
        
        console.log(`[MP Webhook] Financial Calculation for transaction ${transactionId}:`);
        console.log(`  - Total Value: R$ ${totalValue.toFixed(2)}`);
        console.log(`  - Applied Percentage: ${appliedPercentage}%`);
        console.log(`  - Platform Commission: R$ ${platformAmount.toFixed(2)}`);
        console.log(`  - Manager Net Amount: R$ ${managerAmount.toFixed(2)}`);
        console.log(`  - Company ID: ${companyId}`);

        // 7. Registrar a divisão financeira na tabela financial_splits
        // IMPORTANTE: Gravar 2 registros separados conforme regra de negócio:
        // a) Um registro para o valor líquido do organizador (manager_amount preenchido, platform_amount = 0)
        // b) Um registro para a comissão da plataforma (platform_amount preenchido, manager_amount = 0)
        // Usando split_type como flag para identificar claramente cada registro
        
        // Preparar os 2 registros de financial_splits conforme regra de negócio
        // IMPORTANTE: A identificação de qual registro é comissão é feita por:
        // - Registro com platform_amount > 0 e manager_amount = 0 → Comissão do sistema
        // - Registro com manager_amount > 0 e platform_amount = 0 → Valor líquido do organizador
        const financialSplitsToInsert = [
            // Registro 1: Valor líquido do organizador (manager)
            {
                transaction_id: transactionId,
                event_id: eventId,
                manager_user_id: managerUserId,
                platform_amount: 0, // Zero identifica que este é o valor líquido do organizador
                manager_amount: managerAmount, // Valor líquido do organizador
                total_amount: totalValue,
                applied_percentage: appliedPercentage,
            },
            // Registro 2: Comissão da plataforma (sistema)
            {
                transaction_id: transactionId,
                event_id: eventId,
                manager_user_id: managerUserId,
                platform_amount: platformAmount, // Valor > 0 identifica que este é a comissão do sistema
                manager_amount: 0, // Zero identifica que este é a comissão
                total_amount: totalValue,
                applied_percentage: appliedPercentage,
            }
        ];

        // Inserir os 2 registros de forma atômica (se um falhar, ambos falham)
        // Usando transação implícita do Supabase (insert em lote)
        const { error: insertSplitError } = await supabaseService
            .from('financial_splits')
            .insert(financialSplitsToInsert);

        if (insertSplitError) {
            console.error(`[MP Webhook] Critical Error: Failed to insert financial splits for transaction ${transactionId}:`, insertSplitError);
            // Se a inserção falhar, reverter a atualização do receivable para manter consistência
            await supabaseService
                .from('receivables')
                .update({ status: 'pending' })
                .eq('id', transactionId);
            throw new Error(`Failed to record financial splits: ${insertSplitError.message}`);
        }
        
        console.log(`[MP Webhook] Successfully inserted 2 financial split records for transaction ${transactionId}:`);
        console.log(`  - Manager Net Amount Record: R$ ${managerAmount.toFixed(2)}`);
        console.log(`  - Platform Commission Record: R$ ${platformAmount.toFixed(2)}`);

        // 7. Atualizar wristband analytics: associar cliente e marcar como 'used'/'purchase'
        // IMPORTANTE: Buscar TODOS os campos obrigatórios para evitar erro de NOT NULL constraint
        const { data: analyticsToUpdate, error: fetchUpdateError } = await supabaseService
            .from('wristband_analytics')
            .select('id, wristband_id, code_wristbands, sequential_number, status, event_type, event_data')
            .in('id', analyticsIds);
            
        if (fetchUpdateError) {
            console.error("CRITICAL: Failed to fetch analytics records for update:", fetchUpdateError);
            throw new Error("Payment approved, but failed to retrieve ticket details for assignment.");
        }
        
        if (!analyticsToUpdate || analyticsToUpdate.length === 0) {
            console.error(`CRITICAL: No analytics records found for IDs: ${analyticsIds.join(', ')}`);
            throw new Error("Payment approved, but no analytics records found for assignment.");
        }
        
        // Prepara batch update para analytics records
        // IMPORTANTE: Incluir TODOS os campos obrigatórios (NOT NULL) para evitar erro 23502
        const updates = analyticsToUpdate.map(record => {
            // Preservar event_data existente e adicionar dados da compra
            const existingEventData = record.event_data || {};
            const purchaseEventData = {
                ...existingEventData,
                purchase_date: new Date().toISOString(),
                client_id: clientUserId,
                transaction_id: transactionId,
                platform_commission_percentage: appliedPercentage,
                platform_commission_amount: platformAmount,
                manager_net_amount: managerAmount,
            };
            
            return {
                id: record.id,
                wristband_id: record.wristband_id, // Campo obrigatório
                code_wristbands: record.code_wristbands, // Campo obrigatório
                sequential_number: record.sequential_number, // Campo obrigatório (pode ser null, mas incluímos)
                client_user_id: clientUserId,
                status: 'used', 
                event_type: 'purchase',
                event_data: purchaseEventData,
            };
        });

        // Usar update em vez de upsert para garantir que apenas os registros existentes sejam atualizados
        // E fazer update individual para cada registro para garantir atomicidade
        for (const update of updates) {
            const { error: updateError } = await supabaseService
                .from('wristband_analytics')
                .update({
                    client_user_id: update.client_user_id,
                    status: update.status,
                    event_type: update.event_type,
                    event_data: update.event_data,
                })
                .eq('id', update.id);
            
            if (updateError) {
                console.error(`CRITICAL: Failed to update wristband analytics record ${update.id}:`, updateError);
                throw new Error(`Failed to update wristband analytics: ${updateError.message}`);
            }
        }
        
        console.log(`[MP Webhook] Successfully updated ${updates.length} wristband analytics records for transaction ${transactionId}`);
        
        return new Response(JSON.stringify({ message: 'Payment approved, financial split recorded, and tickets assigned.' }), { status: 200, headers: corsHeaders });

    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        // 4. Atualizar status da transação para 'failed'
        const { error: updateReceivableError } = await supabaseService
            .from('receivables')
            .update({ status: 'failed' })
            .eq('id', transactionId);

        if (updateReceivableError) throw updateReceivableError;
        
        // NOTA: Não precisamos reverter o status 'active' dos analytics, pois eles nunca foram alterados.
        
        return new Response(JSON.stringify({ message: `Payment ${paymentStatus}. Transaction marked as failed.` }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ message: 'Notification processed (no status change).' }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});