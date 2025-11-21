import { useState, useEffect } from 'react';
import { ProfileData } from './use-profile'; // Importando o tipo de dado

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
    'rua',
    'numero',
];

// Função auxiliar para verificar se um valor é considerado vazio
const isValueEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
};

export function useProfileStatus(profile: ProfileData | null | undefined, isLoading: boolean): ProfileStatus {
    const [status, setStatus] = useState<ProfileStatus>({
        isComplete: true,
        hasPendingNotifications: false,
        loading: isLoading,
    });

    useEffect(() => {
        setStatus(prev => ({ ...prev, loading: isLoading }));

        if (isLoading) return;

        if (!profile) {
            // Se não há perfil (usuário logado, mas perfil não carregado), consideramos incompleto/pendente
            setStatus({ isComplete: false, hasPendingNotifications: true, loading: false });
            return;
        }

        let missingEssential = false;
        let missingAddressDetail = false;

        // 1. Verificar campos essenciais
        for (const field of ESSENTIAL_FIELDS) {
            // Usamos a indexação segura e garantimos que o valor seja limpo (se for string)
            const value = profile[field as keyof ProfileData];
            if (isValueEmpty(value)) {
                missingEssential = true;
                break;
            }
        }

        // 2. Verificar campos de endereço se o CEP estiver preenchido
        const cep = profile.cep ? String(profile.cep).replace(/\D/g, '') : null;
        
        if (cep && cep.length === 8) {
            // Se o CEP está preenchido, verificamos se Rua e Número estão preenchidos
            for (const field of ADDRESS_FIELDS) {
                const value = profile[field as keyof ProfileData];
                if (isValueEmpty(value)) {
                    missingAddressDetail = true;
                    break;
                }
            }
        }

        const profileIsComplete = !missingEssential && !missingAddressDetail;
        
        setStatus({
            isComplete: profileIsComplete,
            hasPendingNotifications: !profileIsComplete,
            loading: false,
        });
    }, [profile, isLoading]);

    return status;
}