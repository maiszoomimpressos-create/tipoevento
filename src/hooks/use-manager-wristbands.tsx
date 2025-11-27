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

const fetchManagerWristbands = async (userId: string, userTypeId: number): Promise<WristbandData[]> => {
    if (!userId) {
        console.warn("Attempted to fetch wristbands without a userId.");
        return [];
    }

    let query = supabase
        .from('wristbands')
        .select(`
            id,
            code,
            access_type,
            status,
            created_at,
            event_id,
            events (title)
        `);

    // Se não for Admin Master (tipo 1), a RLS já filtra por empresa/gestor.
    // Se for Admin Master, a RLS permite ver tudo, então não adicionamos filtro aqui.
    // Apenas ordenamos.
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching manager wristbands from Supabase:", error);
        throw new Error(error.message); 
    }
    
    return data as WristbandData[];
};

export const useManagerWristbands = (userId: string | undefined, userTypeId: number | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['managerWristbands', userId, userTypeId], // Inclui userTypeId na chave de cache
        queryFn: () => fetchManagerWristbands(userId!, userTypeId!),
        enabled: !!userId && !!userTypeId, // Habilita a query apenas se ambos estiverem disponíveis
        staleTime: 1000 * 30, // 30 seconds
        onError: (error) => {
            console.error("Query Error:", error);
            showError("Erro ao carregar lista de pulseiras. Tente recarregar a página.");
        }
    });

    return {
        ...query,
        wristbands: query.data || [],
        invalidateWristbands: () => queryClient.invalidateQueries({ queryKey: ['managerWristbands', userId, userTypeId] }),
    };
};