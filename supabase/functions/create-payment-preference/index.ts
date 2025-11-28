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

  // 1. Authentication Check (using user's JWT for client identification)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
      status: 401, 
      headers: corsHeaders 
    });
  }
  
  const supabaseAnon = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token or user not found' }), { 
      status: 401, 
      headers: corsHeaders 
    });
  }
  const clientUserId = user.id;
  console.log(`[DEBUG] Client authenticated. User ID: ${clientUserId}`);

  try {
    const body = await req.json();
    const { eventId, purchaseItems } = body; // purchaseItems: [{ ticketTypeId, quantity, price, name }]
    
    console.log(`[DEBUG] Received request for Event ID: ${eventId}`);

    if (!eventId || !purchaseItems || purchaseItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing event details or purchase items' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }
    
    // Calculate total value
    const totalValue = purchaseItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // 2. Fetch Event Details to get Manager ID
    const { data: eventData, error: eventError } = await supabaseService
        .from('events')
        .select('user_id')
        .eq('id', eventId)
        .single();

    if (eventError || !eventData) {
        console.error(`[DEBUG] Event ID ${eventId} not found or error:`, eventError);
        return new Response(JSON.stringify({ error: 'Event not found or manager data missing.' }), { 
            status: 404, 
            headers: corsHeaders 
        });
    }
    
    const managerUserId = eventData.user_id;
    console.log(`[DEBUG] Event found. Manager ID: ${managerUserId}`);
    
    // 3. Fetch Manager Payment Settings directly using managerUserId - Using .limit(1) instead of .single()
    console.log(`[DEBUG BREAKPOINT] Attempting to fetch payment settings for manager: ${managerUserId}`);
    
    const { data: paymentSettingsArray, error: settingsError } = await supabaseService
        .from('payment_settings')
        .select('api_token')
        .eq('user_id', managerUserId)
        .limit(1); // Changed from .single() to .limit(1)

    let paymentSettingsData = null;
    if (paymentSettingsArray && paymentSettingsArray.length > 0) {
        paymentSettingsData = paymentSettingsArray[0];
    }

    // Se houver erro na busca (incluindo PGRST116 - No rows found) ou se o token estiver ausente
    if (settingsError || !paymentSettingsData?.api_token) {
        console.error(`[DEBUG ERROR] Payment settings fetch failed for manager ${managerUserId}. Error: ${settingsError?.message || 'Token missing'}`);
        
        // Se o erro for PGRST116 (No rows found), significa que o gestor não configurou nada.
        if (settingsError?.code === 'PGRST116') {
             return new Response(JSON.stringify({ error: 'Payment gateway access token is not configured by the event manager. Please ask the manager to configure it in PRO Settings.' }), { 
                status: 403, 
                headers: corsHeaders 
            });
        }
        
        // Outros erros de busca
        if (settingsError) throw settingsError;
        
        // Se o token estiver ausente (null/undefined)
        return new Response(JSON.stringify({ error: 'Payment gateway access token is not configured by the event manager. Please ask the manager to configure it in PRO Settings.' }), { 
            status: 403, 
            headers: corsHeaders 
        });
    }
    
    const mpAccessToken = paymentSettingsData.api_token; 
    console.log(`[DEBUG] Access Token found (masked length: ${mpAccessToken.length})`);
    
    // 4. Reserve/Identify available wristband analytics records
    const analyticsIdsToReserve: string[] = [];
    
    for (const item of purchaseItems) {
        const { ticketTypeId, quantity } = item;
        
        // Fetch N records of analytics that are 'active' and not associated with a client
        const { data: availableAnalytics, error: fetchAnalyticsError } = await supabaseService
            .from('wristband_analytics')
            .select('id')
            .eq('wristband_id', ticketTypeId)
            .eq('status', 'active')
            .is('client_user_id', null)
            .limit(quantity);

        if (fetchAnalyticsError) throw fetchAnalyticsError;

        if (!availableAnalytics || availableAnalytics.length < quantity) {
            return new Response(JSON.stringify({ error: `Not enough tickets available for type ${ticketTypeId}. Available: ${availableAnalytics?.length || 0}. Requested: ${quantity}.` }), { 
                status: 409, 
                headers: corsHeaders 
            });
        }
        
        analyticsIdsToReserve.push(...availableAnalytics.map(a => a.id));
    }
    
    // 5. Insert pending transaction into receivables
    const { data: transactionData, error: insertTransactionError } = await supabaseService
        .from('receivables')
        .insert({
            client_user_id: clientUserId,
            manager_user_id: managerUserId,
            event_id: eventId,
            total_value: totalValue,
            status: 'pending',
            wristband_analytics_ids: analyticsIdsToReserve, // IDs reservados
        })
        .select('id')
        .single();

    if (insertTransactionError) throw insertTransactionError;
    const transactionId = transactionData.id;
    
    // 6. Configure Mercado Pago SDK
    mercadopago.configure({
        access_token: mpAccessToken,
    });

    // 7. Prepare MP Preference Items
    const mpItems = purchaseItems.map((item: any) => ({
        title: item.name || 'Ingresso Evento',
        unit_price: item.price,
        quantity: item.quantity,
        currency_id: 'BRL',
    }));
    
    // 8. Create MP Preference
    
    // Obtém a URL base do projeto Supabase para construir as URLs de retorno e notificação
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const notificationUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;
    const successUrl = `${supabaseUrl}/tickets?status=success&transaction_id=${transactionId}`;
    const pendingUrl = `${supabaseUrl}/tickets?status=pending&transaction_id=${transactionId}`;
    const failureUrl = `${supabaseUrl}/tickets?status=failure&transaction_id=${transactionId}`;
    
    console.log(`[DEBUG] Notification URL: ${notificationUrl}`);
    console.log(`[DEBUG] Success URL: ${successUrl}`);

    const preference = {
        items: mpItems,
        external_reference: transactionId, // Usamos o ID da transação como referência externa
        notification_url: notificationUrl, 
        back_urls: {
            success: successUrl,
            pending: pendingUrl,
            failure: failureUrl,
        },
        auto_return: "approved",
    };

    const mpResponse = await mercadopago.preferences.create(preference);
    
    if (!mpResponse.body.init_point) {
        // Se falhar, reverter a transação pendente
        await supabaseService.from('receivables').delete().eq('id', transactionId);
        return new Response(JSON.stringify({ error: 'Failed to create Mercado Pago preference. Check MP configuration details.' }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }

    // 9. Update receivables with payment gateway ID (MP preference ID)
    await supabaseService
        .from('receivables')
        .update({ payment_gateway_id: mpResponse.body.id })
        .eq('id', transactionId);

    // 10. Return checkout URL
    return new Response(JSON.stringify({ 
        message: 'Payment preference created successfully.',
        checkoutUrl: mpResponse.body.init_point,
        transactionId: transactionId,
    }), { 
        status: 200, 
        headers: corsHeaders 
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    // Em caso de erro, tentamos reverter a transação pendente se ela existir
    // (Lógica de reversão mais robusta seria necessária em produção)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});