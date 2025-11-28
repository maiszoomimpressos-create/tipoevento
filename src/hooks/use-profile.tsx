import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface ProfileData {
    id: string; // Adicionado o ID do perfil
    first_name: string;
    last_name: string; // Adicionado last_name
    avatar_url: string | null;
    cpf: string;
    rg: string;
    birth_date: string;
    gender: string | null; // Permitir null para o gênero
    cep: string;
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    numero: string;
    complemento: string;
    tipo_usuario_id: number;
}

const fetchProfile = async (userId: string): Promise<ProfileData | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id, first_name, last_name, avatar_url, cpf, rg, birth_date, gender, 
            cep, rua, bairro, cidade, estado, numero, complemento,
            tipo_usuario_id
        `)
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
    
    // Mapeia dados para garantir que campos que podem ser NULL no DB sejam strings vazias no frontend
    // ou null, dependendo da necessidade do componente. Para 'gender', null é aceitável.
    return {
        id: data.id, // Incluindo o ID
        first_name: data.first_name || '',
        last_name: data.last_name || '', // Mapeando last_name
        avatar_url: data.avatar_url || null,
        cpf: data.cpf || '',
        rg: data.rg || '',
        birth_date: data.birth_date || '',
        gender: data.gender || null, // Mapeia null para null, string vazia para string vazia
        cep: data.cep || '',
        rua: data.rua || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        tipo_usuario_id: data.tipo_usuario_id,
    } as ProfileData;
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