import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface ProfileData {
    first_name: string;
    avatar_url: string | null;
    cpf: string | null;
    rg: string | null;
    birth_date: string | null;
    gender: string | null;
    cep: string | null;
    rua: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    numero: string | null;
    complemento: string | null;
    tipo_usuario_id: number;
}

const fetchProfile = async (userId: string): Promise<ProfileData | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            first_name, avatar_url, cpf, rg, birth_date, gender, 
            cep, rua, bairro, cidade, estado, numero, complemento,
            tipo_usuario_id
        `)
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        // Não mostramos toast de erro aqui para evitar spam, o componente de login/perfil deve lidar com isso.
        return null;
    }
    
    return data as ProfileData;
};

export const useProfile = (userId: string | undefined) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['profile', userId],
        queryFn: () => fetchProfile(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        ...query,
        profile: query.data,
        invalidateProfile: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
    };
};

export type { ProfileData };