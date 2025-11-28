import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface CompanyData {
    id: string;
    cnpj: string;
    corporate_name: string;
}

// Modificado para buscar um array de empresas
const fetchCompanies = async (userId: string): Promise<CompanyData[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
        .from('companies')
        .select('id, cnpj, corporate_name')
        .eq('user_id', userId); // Removido .single() para permitir múltiplos resultados

    if (error) {
        console.error("Error fetching companies:", error);
        throw new Error(error.message);
    }

    return data as CompanyData[];
};

export const useManagerCompany = (userId: string | undefined) => {
    const query = useQuery({
        queryKey: ['managerCompany', userId],
        queryFn: () => fetchCompanies(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        onError: (error) => {
            console.error("Query Error: Failed to load company data.", error);
            showError("Erro ao carregar dados da empresa. Verifique se o Perfil da Empresa está cadastrado.");
        }
    });

    return {
        ...query,
        // Retorna a primeira empresa encontrada, ou null se nenhuma for encontrada
        company: query.data && query.data.length > 0 ? query.data[0] : null,
        // Também expõe todas as empresas, caso seja necessário no futuro
        allCompanies: query.data || [],
    };
};

export type { CompanyData };