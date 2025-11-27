import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface ManagerEvent {
    id: string;
    title: string;
    // Removendo campos não essenciais para a listagem inicial
}

const fetchManagerEvents = async (userId: string, userTypeId: number): Promise<ManagerEvent[]> => {
    if (!userId) {
        console.warn("Attempted to fetch manager events without a userId.");
        return [];
    }

    let query = supabase
        .from('events')
        .select(`
            id,
            title
        `);

    // Se não for Admin Master (tipo 1), filtra por user_id
    if (userTypeId !== 1) {
        query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching manager events from Supabase:", error);
        // Lançamos o erro para que o useQuery o capture e dispare o onError
        throw new Error(error.message); 
    }
    
    return data as ManagerEvent[];
};

export const useManagerEvents = (userId: string | undefined, userTypeId: number | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['managerEvents', userId, userTypeId], // Inclui userTypeId na chave de cache
        queryFn: () => fetchManagerEvents(userId!, userTypeId!),
        enabled: !!userId && !!userTypeId, // Habilita a query apenas se ambos estiverem disponíveis
        staleTime: 1000 * 60 * 1, // 1 minute
        // Adicionando tratamento de erro para exibir o toast
        onError: (error) => {
            console.error("Query Error:", error);
            showError("Erro ao carregar eventos. Tente recarregar a página.");
        }
    });

    return {
        ...query,
        events: query.data || [],
        invalidateEvents: () => queryClient.invalidateQueries({ queryKey: ['managerEvents', userId, userTypeId] }),
    };
};