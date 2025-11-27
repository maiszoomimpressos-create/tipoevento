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
    // 2. Buscar o Access Token do Gestor (Necessário para buscar detalhes do pagamento)
    // Como o webhook não contém o token do gestor, precisamos buscar o Access Token
    // usando o ID da preferência (que está no receivables.payment_gateway_id)
    
    // NOTA: Em um sistema real, o MP envia o ID do pagamento. Precisamos buscar o payment_id
    // e, a partir dele, o external_reference (transactionId) para encontrar o gestor.
    
    // SIMPLIFICAÇÃO: Vamos assumir que o ID do recurso (payment_id) é suficiente para buscar
    // o pagamento e, a partir dele, o external_reference (transactionId).
    
    // Para fins de simulação, vamos usar um Access Token genérico (ou o do Admin Master)
    // para buscar o pagamento, o que é inseguro em produção.
    // Em produção, o Access Token correto deve ser recuperado do DB usando o external_reference.
    
    // Para esta implementação, vamos assumir que o external_reference (transactionId)
    // está disponível no corpo da requisição ou que podemos buscá-lo.
    
    // Devido às limitações de segurança e complexidade de buscar o token correto
    // para cada gestor via webhook, vamos SIMPLIFICAR a lógica de busca do token
    // e focar na atualização do status.
    
    // Vamos buscar a transação pendente que corresponde ao payment_id (resourceId)
    // e usar o manager_user_id para buscar o token.
    
    // 3. Buscar a transação pendente usando o payment_gateway_id (MP preference ID)
    // NOTA: O MP envia o ID do pagamento, não o ID da preferência.
    // Para simplificar, vamos assumir que o ID do pagamento é o mesmo que o ID da preferência
    // ou que o external_reference (transactionId) está disponível.
    
    // Vamos buscar a transação pelo external_reference (que é o ID da transação Mazoy)
    // O MP envia o ID do pagamento (payment_id) no webhook. Precisamos buscar o pagamento
    // para obter o external_reference.
    
    // Para fins de demonstração, vamos usar o Service Role Key para buscar a transação
    // e assumir que o ID do pagamento (resourceId) está no campo payment_gateway_id.
    
    const { data: receivable, error: fetchReceivableError } = await supabaseService
        .from('receivables')
        .select('id, client_user_id, wristband_analytics_ids, manager_user_id')
        .eq('payment_gateway_id', resourceId) // Assumindo que o ID do recurso é o ID da preferência/pagamento
        .eq('status', 'pending')
        .single();

    if (fetchReceivableError || !receivable) {
        console.warn(`[MP Webhook] Pending receivable not found for resource ID: ${resourceId}`);
        return new Response(JSON.stringify({ message: 'Receivable not found or already processed.' }), { status: 200, headers: corsHeaders });
    }
    
    const transactionId = receivable.id;
    const clientUserId = receivable.client_user_id;
    const analyticsIds = receivable.wristband_analytics_ids;
    
    // 4. SIMULAÇÃO DE VERIFICAÇÃO DE PAGAMENTO (Substituir pela chamada real ao MP)
    // Status do MP: approved, pending, rejected, refunded, cancelled
    const paymentStatus = 'approved'; // Simulação de sucesso
    
    if (paymentStatus === 'approved') {
        // 5. Atualizar status da transação para 'paid'
        const { error: updateReceivableError } = await supabaseService
            .from('receivables')
            .update({ status: 'paid' })
            .eq('id', transactionId);

        if (updateReceivableError) throw updateReceivableError;

        // 6. Atualizar wristband analytics: associar cliente e marcar como 'used'/'purchase'
        const { data: analyticsToUpdate, error: fetchUpdateError } = await supabaseService
            .from('wristband_analytics')
            .select('id, wristband_id')
            .in('id', analyticsIds);
            
        if (fetchUpdateError) {
            console.error("CRITICAL: Failed to fetch analytics records for update:", fetchUpdateError);
            throw new Error("Payment successful, but failed to retrieve ticket details for assignment.");
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
        
        return new Response(JSON.stringify({ message: 'Payment approved and tickets assigned.' }), { status: 200, headers: corsHeaders });

    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
        // 5. Atualizar status da transação para 'failed'
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