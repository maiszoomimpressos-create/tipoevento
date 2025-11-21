import { useState, useEffect } from 'react';
import { ProfileData } from './use-profile';

interface ProfileStatus {
    isComplete: boolean;
    hasPendingNotifications: boolean;
    loading: boolean;
    missingFields: string[];
}

const FIELD_NAMES: Record<keyof ProfileData, string> = {
    first_name: 'Nome',
    cpf: 'CPF',
    birth_date: 'Data de Nascimento',
    rg: 'RG',
    gender: 'Gênero',
    cep: 'CEP',
    rua: 'Rua',
    bairro: 'Bairro',
    cidade: 'Cidade',
    estado: 'Estado',
    numero: 'Número',
    avatar_url: 'Foto de Perfil',
    tipo_usuario_id: 'Tipo de Usuário',
    complemento: 'Complemento',
};

// Lista definitiva de campos necessários para remover a notificação.
const ALL_REQUIRED_FIELDS: (keyof ProfileData)[] = [
    'first_name', 'cpf', 'birth_date', 'rg', 'gender',
    'cep', 'rua', 'bairro', 'cidade', 'estado', 'numero',
];

// Função para verificar se um valor é nulo, indefinido ou uma string vazia.
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
        missingFields: [],
    });

    useEffect(() => {
        setStatus(prev => ({ ...prev, loading: isLoading, missingFields: [] }));

        if (isLoading) return;

        const missing: string[] = [];

        if (!profile) {
            // Se o perfil não existe, todos os campos estão faltando.
            missing.push(...ALL_REQUIRED_FIELDS.map(field => FIELD_NAMES[field]));
        } else {
            // Itera sobre cada campo obrigatório para verificar se está preenchido.
            for (const field of ALL_REQUIRED_FIELDS) {
                const value = profile[field];
                if (isValueEmpty(value)) {
                    missing.push(FIELD_NAMES[field]);
                }
            }
        }
        
        const isProfileConsideredComplete = missing.length === 0;

        setStatus({
            isComplete: isProfileConsideredComplete,
            hasPendingNotifications: !isProfileConsideredComplete,
            loading: false,
            missingFields: missing,
        });
    }, [profile, isLoading]);

    return status;
}