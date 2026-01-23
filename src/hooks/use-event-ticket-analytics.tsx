import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WristbandDetailsForAnalytics {
    id: string;
    code: string;
    status: 'active' | 'used' | 'lost' | 'cancelled' | 'pending';
    price: number;
    access_type: string;
    created_at: string;
    
    analytics?: {
        client_user_id?: string;
        event_data?: {
            purchase_date?: string;
            client_id?: string;
            transaction_id?: string;
        };
        profiles?: {
            full_name: string;
            email: string;
        } | null;
    };
}

const fetchEventTicketAnalytics = async (eventId: string): Promise<WristbandDetailsForAnalytics[]> => {
    if (!eventId) {
        return [];
    }

    const { data: wristbands, error: wristbandsError } = await supabase
        .from('wristbands')
        .select(`
            id,
            code,
            status,
            price,
            access_type,
            created_at,
            wristband_analytics!left (
                client_user_id,
                event_data,
            profiles(full_name, email)
            )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

    if (wristbandsError) {
        console.error("Error fetching wristband analytics:", wristbandsError);
        console.error("Full Supabase error object:", JSON.stringify(wristbandsError, null, 2));
        throw wristbandsError;
    }

    // Flatten the data structure for easier consumption
    return wristbands.map((w: any) => ({
        id: w.id,
        code: w.code,
        status: w.status,
        price: w.price,
        access_type: w.access_type,
        created_at: w.created_at,
        analytics: w.wristband_analytics && w.wristband_analytics.length > 0 
            ? {
                client_user_id: w.wristband_analytics[0].client_user_id,
                event_data: w.wristband_analytics[0].event_data,
                profiles: w.wristband_analytics[0].profiles,
            }
            : undefined,
    }));
};

export const useEventTicketAnalytics = (eventId: string) => {
    return useQuery<WristbandDetailsForAnalytics[], Error>({
        queryKey: ['event-ticket-analytics', eventId],
        queryFn: () => fetchEventTicketAnalytics(eventId),
        enabled: !!eventId,
    });
};

