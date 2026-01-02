import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface ManagerEvent {
    id: string;
    title: string;
    is_draft: boolean; // NOVO: Status de rascunho
    date: string; // Adicionado: Data do evento
    company_id: string; // Adicionado: ID da empresa
    // Removendo campos não essenciais para a listagem inicial
}

const fetchManagerEvents = async (userId: string, isAdminMaster: boolean): Promise<ManagerEvent[]> => {
    if (!userId) {
        console.warn("Attempted to fetch manager events without a userId.");
        return [];
    }

    let query = supabase
        .from('events')
        .select(`
            id,
            title,
            is_draft,
            date,
            company_id
        `)
        .order('created_at', { ascending: false });

    if (!isAdminMaster) {
        // Para gestores normais, primeiro precisamos do company_id
        const { data: companyData, error: companyError } = await supabase
            .from('user_companies')
            .select('company_id')
            .eq('user_id', userId)
            .eq('is_primary', true)
            .limit(1)
            .single();

        if (companyError && companyError.code !== 'PGRST116') {
            console.error("Error fetching company ID for manager events:", companyError);
            throw new Error(companyError.message);
        }

        if (!companyData?.company_id) {
            console.warn("Manager has no primary company associated. Returning empty event list.");
            return [];
        }
        query = query.eq('company_id', companyData.company_id);
    }
    // Se for isAdminMaster, nenhum filtro de company_id é aplicado,
    // e a RLS no banco de dados já garante o acesso total.

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching manager events from Supabase:", error);
        throw new Error(error.message); 
    }
    
    return data as ManagerEvent[];
};

export const useManagerEvents = (userId: string | undefined, isAdminMaster: boolean) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['managerEvents', userId, isAdminMaster], // Adiciona isAdminMaster à chave de cache
        queryFn: () => fetchManagerEvents(userId!, isAdminMaster),
        enabled: !!userId, // Só executa se tiver o userId
        staleTime: 1000 * 60 * 1, // 1 minute
        onError: (error) => {
            console.error("Query Error:", error);
            showError("Erro ao carregar eventos. Tente recarregar a página.");
        }
    });

    return {
        ...query,
        events: query.data || [],
        invalidateEvents: () => queryClient.invalidateQueries({ queryKey: ['managerEvents', userId, isAdminMaster] }),
    };
};