import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface ManagerEvent {
    id: string;
    title: string;
    // Removendo campos não essenciais para a listagem inicial
}

const fetchManagerEvents = async (userId: string): Promise<ManagerEvent[]> => {
    if (!userId) {
        console.warn("Attempted to fetch manager events without a userId.");
        return [];
    }

    // Buscamos explicitamente os eventos onde o user_id é igual ao userId logado.
    // Isso garante que, mesmo com uma política RLS ampla (USING true) ativa, 
    // a área de gerenciamento só mostre os eventos do gestor.
    const { data, error } = await supabase
        .from('events')
        .select(`
            id,
            title
        `)
        .eq('user_id', userId) // FILTRO EXPLÍCITO
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching manager events from Supabase:", error);
        // Lançamos o erro para que o useQuery o capture e dispare o onError
        throw new Error(error.message); 
    }
    
    return data as ManagerEvent[];
};

export const useManagerEvents = (userId: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['managerEvents', userId],
        queryFn: () => fetchManagerEvents(userId!),
        enabled: !!userId,
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
        invalidateEvents: () => queryClient.invalidateQueries({ queryKey: ['managerEvents', userId] }),
    };
};