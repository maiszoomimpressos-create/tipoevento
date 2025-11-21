import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface CompanyData {
    id: string;
    cnpj: string;
    corporate_name: string;
}

const fetchCompanyId = async (userId: string): Promise<CompanyData | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('companies')
        .select('id, cnpj, corporate_name')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error("Error fetching company ID:", error);
        throw new Error(error.message);
    }
    
    return data as CompanyData;
};

export const useManagerCompany = (userId: string | undefined) => {
    const query = useQuery({
        queryKey: ['managerCompany', userId],
        queryFn: () => fetchCompanyId(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        onError: (error) => {
            console.error("Query Error: Failed to load company data.", error);
            showError("Erro ao carregar dados da empresa. Verifique se o Perfil da Empresa está cadastrado.");
        }
    });

    return {
        ...query,
        company: query.data,
    };
};

export type { CompanyData };