import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileStatus {
    isComplete: boolean;
    hasPendingNotifications: boolean;
    loading: boolean;
}

// Campos considerados essenciais para o perfil
const ESSENTIAL_FIELDS = [
    'first_name', 
    'cpf', 
    'birth_date',
];

// Campos de endereço que, se o CEP for preenchido, devem ser verificados
const ADDRESS_FIELDS = [
    'cep',
    'rua',
    'numero',
];

// Função auxiliar para verificar se um valor é considerado vazio
const isValueEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
};

export function useProfileStatus(userId: string | undefined): ProfileStatus {
    const [status, setStatus] = useState<ProfileStatus>({
        isComplete: true,
        hasPendingNotifications: false,
        loading: true,
    });

    useEffect(() => {
        if (!userId) {
            setStatus({ isComplete: true, hasPendingNotifications: false, loading: false });
            return;
        }

        const checkProfile = async () => {
            setStatus(prev => ({ ...prev, loading: true }));

            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    ${ESSENTIAL_FIELDS.join(', ')},
                    ${ADDRESS_FIELDS.join(', ')}
                `)
                .eq('id', userId)
                .single();

            if (error || !data) {
                console.error("Error fetching profile status:", error);
                setStatus({ isComplete: false, hasPendingNotifications: true, loading: false });
                return;
            }

            let missingEssential = false;
            let missingAddressDetail = false;

            // 1. Verificar campos essenciais
            for (const field of ESSENTIAL_FIELDS) {
                if (isValueEmpty(data[field])) {
                    missingEssential = true;
                    break;
                }
            }

            // 2. Verificar campos de endereço se o CEP estiver preenchido
            const cep = data.cep ? String(data.cep).replace(/\D/g, '') : null;
            
            if (cep && cep.length === 8) {
                // Se o CEP está preenchido, verificamos se Rua e Número estão preenchidos
                if (isValueEmpty(data.rua) || isValueEmpty(data.numero)) {
                    missingAddressDetail = true;
                }
            }

            const profileIsComplete = !missingEssential && !missingAddressDetail;
            
            setStatus({
                isComplete: profileIsComplete,
                hasPendingNotifications: !profileIsComplete,
                loading: false,
            });
        };

        checkProfile();
    }, [userId]);

    return status;
}