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

  try {
    const { eventId, purchaseItems } = await req.json(); // purchaseItems: [{ ticketTypeId, quantity, price, name }]

    if (!eventId || !purchaseItems || purchaseItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing event details or purchase items' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }
    
    // Calculate total value
    const totalValue = purchaseItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // 2. Fetch Event Details to get Manager ID and Company Payment Settings
    const { data: eventData, error: eventError } = await supabaseService
        .from('events')
        .select('user_id, companies(payment_settings(api_key, api_token))')
        .eq('id', eventId)
        .single();

    if (eventError || !eventData) {
        return new Response(JSON.stringify({ error: 'Event not found or manager data missing.' }), { 
            status: 404, 
            headers: corsHeaders 
        });
    }
    
    const managerUserId = eventData.user_id;
    const paymentSettings = eventData.companies?.payment_settings?.[0];
    
    // Usamos api_token como o Access Token do Mercado Pago
    const mpAccessToken = paymentSettings?.api_token; 
    
    if (!mpAccessToken) {
        return new Response(JSON.stringify({ error: 'Payment gateway access token is not configured by the manager.' }), { 
            status: 403, 
            headers: corsHeaders 
        });
    }
    
    // 3. Reserve/Identify available wristband analytics records
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
            return new Response(JSON.stringify({ error: `Not enough tickets available for type ${ticketTypeId}.` }), { 
                status: 409, 
                headers: corsHeaders 
            });
        }
        
        analyticsIdsToReserve.push(...availableAnalytics.map(a => a.id));
    }
    
    // 4. Insert pending transaction into receivables
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
    
    // 5. Configure Mercado Pago SDK
    mercadopago.configure({
        access_token: mpAccessToken,
    });

    // 6. Prepare MP Preference Items
    const mpItems = purchaseItems.map((item: any) => ({
        title: item.name || 'Ingresso Evento',
        unit_price: item.price,
        quantity: item.quantity,
        currency_id: 'BRL',
    }));
    
    // 7. Create MP Preference
    const preference = {
        items: mpItems,
        external_reference: transactionId, // Usamos o ID da transação como referência externa
        notification_url: `https://yzwfjyejqvawhooecbem.supabase.co/functions/v1/mercadopago-webhook`, // URL da Edge Function de Webhook
        back_urls: {
            success: `${Deno.env.get('SUPABASE_URL')}/tickets?status=success&transaction_id=${transactionId}`,
            pending: `${Deno.env.get('SUPABASE_URL')}/tickets?status=pending&transaction_id=${transactionId}`,
            failure: `${Deno.env.get('SUPABASE_URL')}/tickets?status=failure&transaction_id=${transactionId}`,
        },
        auto_return: "approved",
    };

    const mpResponse = await mercadopago.preferences.create(preference);
    
    if (!mpResponse.body.init_point) {
        // Se falhar, reverter a transação pendente (opcional, mas boa prática)
        await supabaseService.from('receivables').delete().eq('id', transactionId);
        return new Response(JSON.stringify({ error: 'Failed to create Mercado Pago preference.' }), { 
            status: 500, 
            headers: corsHeaders 
        });
    }

    // 8. Update receivables with payment gateway ID (MP preference ID)
    await supabaseService
        .from('receivables')
        .update({ payment_gateway_id: mpResponse.body.id })
        .eq('id', transactionId);

    // 9. Return checkout URL
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