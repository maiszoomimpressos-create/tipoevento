import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import mercadopago from 'https://esm.sh/mercadopago@2.0.8';

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
  
  // Webhooks do Mercado Pago geralmente usam query parameters para notificação
  const url = new URL(req.url);
  const topic = url.searchParams.get('topic');
  const id = url.searchParams.get('id'); // ID da notificação ou do recurso
  const type = url.searchParams.get('type'); // Alias para topic

  if (!topic && !type) {
    return new Response(JSON.stringify({ error: 'Missing topic/type parameter' }), { status: 400, headers: corsHeaders });
  }
  
  // 1. Determinar o tipo de notificação e ID do recurso
  const resourceId = id;
  const notificationType = topic || type;

  if (notificationType !== 'payment' || !resourceId) {
    console.log(`[MP Webhook] Ignoring notification type: ${notificationType} or missing resource ID.`);
    return new Response(JSON.stringify({ message: 'Notification received, but ignored.' }), { status: 200, headers: corsHeaders });
  }

  try {
    // 2. Buscar a transação pendente na tabela 'receivables'
    // IMPORTANT: A tabela 'receivables' precisa ter as colunas 'event_id' e 'total_amount'
    // Estes campos devem ser preenchidos quando o receivable é criado na UI/API de criação de preferência de pagamento.
    const { data: receivableArray, error: fetchReceivableError } = await supabaseService
        .from('receivables')
        .select('id, client_user_id, wristband_analytics_ids, manager_user_id, event_id, total_amount') // Incluir event_id e total_amount
        .eq('payment_gateway_id', resourceId) 
        .eq('status', 'pending')
        .limit(1);

    let receivable = null;
    if (receivableArray && receivableArray.length > 0) {
        receivable = receivableArray[0];
    }

    if (fetchReceivableError || !receivable) {
        console.warn(`[MP Webhook] Pending receivable not found for resource ID: ${resourceId}`);
        return new Response(JSON.stringify({ message: 'Receivable not found or already processed.' }), { status: 200, headers: corsHeaders });
    }
    
    const transactionId = receivable.id;
    const clientUserId = receivable.client_user_id;
    const analyticsIds = receivable.wristband_analytics_ids;
    const managerUserId = receivable.manager_user_id;
    const eventId = receivable.event_id; // Novo campo
    const totalAmount = receivable.total_amount; // Novo campo

    // Validações adicionais para os novos campos
    if (!eventId || !totalAmount) {
        console.error(`[MP Webhook] Critical Error: Receivable ${transactionId} missing event_id or total_amount.`);
        return new Response(JSON.stringify({ error: 'Transaction data incomplete.' }), { status: 500, headers: corsHeaders });
    }

    // 3. SIMULAÇÃO DE VERIFICAÇÃO DE PAGAMENTO (Substituir pela chamada real ao MP)
    // Status do MP: approved, pending, rejected, refunded, cancelled
    // Para produção, você faria uma chamada para a API do Mercado Pago para obter o status real do pagamento.
    const paymentStatus = 'approved'; // Simulação de sucesso
    
    if (paymentStatus === 'approved') {
        // 4. Atualizar status da transação para 'paid'
        const { error: updateReceivableError } = await supabaseService
            .from('receivables')
            .update({ status: 'paid' })
            .eq('id', transactionId);

        if (updateReceivableError) throw updateReceivableError;

        // 5. Buscar o percentual de comissão aplicado ao evento
        const { data: eventData, error: fetchEventError } = await supabaseService
            .from('events')
            .select('applied_percentage')
            .eq('id', eventId)
            .single();
        
        if (fetchEventError || !eventData) {
            console.error(`[MP Webhook] Critical Error: Event ${eventId} not found or missing applied_percentage.`, fetchEventError);
            throw new Error(`Event ${eventId} data incomplete for financial split.`);
        }

        const appliedPercentage = eventData.applied_percentage;
        const platformAmount = totalAmount * (appliedPercentage / 100);
        const managerAmount = totalAmount - platformAmount;

        // 6. Registrar a divisão financeira na nova tabela financial_splits
        const { error: insertSplitError } = await supabaseService
            .from('financial_splits')
            .insert({
                transaction_id: transactionId,
                event_id: eventId,
                manager_user_id: managerUserId,
                platform_amount: platformAmount,
                manager_amount: managerAmount,
                total_amount: totalAmount,
                applied_percentage: appliedPercentage,
            });

        if (insertSplitError) {
            console.error(`[MP Webhook] Critical Error: Failed to insert financial split for transaction ${transactionId}:`, insertSplitError);
            // Lidar com falha na inserção do split (ex: notificar admin, retry, etc.)
        }

        // 7. Atualizar wristband analytics: associar cliente e marcar como 'used'/'purchase'
        const { data: analyticsToUpdate, error: fetchUpdateError } = await supabaseService
            .from('wristband_analytics')
            .select('id, wristband_id')
            .in('id', analyticsIds);
            
        if (fetchUpdateError) {
            console.error("CRITICAL: Failed to fetch analytics records for update:", fetchUpdateError);
            throw new Error("Payment approved, but failed to retrieve ticket details for assignment.");
        }
        
        // Prepara batch update para analytics records
        const updates = analyticsToUpdate.map(record => {
            return {
                id: record.id,
                client_user_id: clientUserId,
                status: 'used', 
                event_type: 'purchase',
                event_data: {
                    purchase_date: new Date().toISOString(),
                    client_id: clientUserId,
                    transaction_id: transactionId,
                    // Outros dados de preço seriam buscados do receivable ou do wristband
                    platform_commission_percentage: appliedPercentage, // Adiciona ao log de dados
                    platform_commission_amount: platformAmount,       // Adiciona ao log de dados
                    manager_net_amount: managerAmount,                // Adiciona ao log de dados
                }
            };
        });

        const { error: updateAnalyticsError } = await supabaseService
            .from('wristband_analytics')
            .upsert(updates);

        if (updateAnalyticsError) {
            console.error("CRITICAL: Failed to update wristband analytics after successful payment:", updateAnalyticsError);
            // A transação foi paga, mas a atribuição falhou. Requer intervenção manual.
        }
        
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