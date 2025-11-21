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

        // 1. Verificar campos essenciais (Nome, CPF, Data de Nascimento)
        for (const field of ESSENTIAL_FIELDS) {
            const value = profile[field as keyof ProfileData];
            if (isValueEmpty(value)) {
                missingEssential = true;
                console.log(`[ProfileStatus] Missing essential field: ${field}`);
                break;
            }
        }

        // 2. Verificar a consistência do endereço
        const cep = profile.cep ? String(profile.cep).replace(/\D/g, '') : null;
        
        // Se o CEP foi preenchido, a Rua e o Número se tornam obrigatórios para um endereço completo.
        if (cep && cep.length === 8) {
            if (isValueEmpty(profile.rua) || isValueEmpty(profile.numero)) {
                missingAddressDetail = true;
                console.log(`[ProfileStatus] CEP is present, but Rua or Numero are missing.`);
            }
        }

        const profileIsComplete = !missingEssential && !missingAddressDetail;
        
        console.log(`[ProfileStatus] Profile Complete: ${profileIsComplete}. Notifications Active: ${!profileIsComplete}`);

        setStatus({
            isComplete: profileIsComplete,
            hasPendingNotifications: !profileIsComplete,
            loading: false,
        });
    }, [profile, isLoading]);

    return status;
}