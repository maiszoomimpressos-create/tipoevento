import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface WristbandData {
    id: string;
    code: string;
    access_type: string;
    status: 'active' | 'used' | 'lost' | 'cancelled';
    created_at: string;
    event_id: string;
    
    // Dados do evento associado (join)
    events: {
        title: string;
    } | null;
}

const fetchManagerWristbands = async (userId: string): Promise<WristbandData[]> => {
    if (!userId) {
        console.warn("Attempted to fetch wristbands without a userId.");
        return [];
    }

    // A RLS garante que apenas as pulseiras da empresa do gestor logado serão retornadas.
    // Fazemos um join com a tabela 'events' para obter o título do evento.
    const { data, error } = await supabase
        .from('wristbands')
        .select(`
            id,
            code,
            access_type,
            status,
            created_at,
            event_id,
            events (title)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching manager wristbands from Supabase:", error);
        throw new Error(error.message); 
    }
    
    return data as WristbandData[];
};

export const useManagerWristbands = (userId: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['managerWristbands', userId],
        queryFn: () => fetchManagerWristbands(userId!),
        enabled: !!userId,
        staleTime: 1000 * 30, // 30 seconds
        onError: (error) => {
            console.error("Query Error:", error);
            showError("Erro ao carregar lista de pulseiras. Tente recarregar a página.");
        }
    });

    return {
        ...query,
        wristbands: query.data || [],
        invalidateWristbands: () => queryClient.invalidateQueries({ queryKey: ['managerWristbands', userId] }),
    };
};