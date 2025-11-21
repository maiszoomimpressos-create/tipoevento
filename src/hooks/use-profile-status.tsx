import { useState, useEffect } from 'react';
import { ProfileData } from './use-profile'; // Importando o tipo de dado
import { supabase } from '@/integrations/supabase/client';

interface ProfileStatus {
    isComplete: boolean;
    hasPendingNotifications: boolean;
    loading: boolean;
}

// Campos considerados essenciais para o perfil do CLIENTE
const ESSENTIAL_FIELDS = [
    'first_name', 
    'cpf', 
    'birth_date',
];

// Campos de endereço que, se preenchidos, exigem atenção
const ADDRESS_FIELDS_TO_CHECK = [
    'rua',
    'numero',
    'bairro',
    'cidade',
    'estado',
];

// Função auxiliar para verificar se um valor é considerado vazio
const isValueEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
};

// Simulação de verificação de notificações de sistema para Gestores
const checkManagerSystemNotifications = async (userId: string, settings: any): Promise<boolean> => {
    if (!settings) return false;

    // Exemplo 1: Alerta de Baixo Estoque (se a configuração estiver ativa)
    if (settings.low_stock_system) {
        // Simulação: Se o gestor tiver mais de 5 eventos, simulamos que um deles está com baixo estoque.
        const { count, error } = await supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        if (error) {
            console.error("Error checking manager events for low stock simulation:", error);
            return false;
        }

        // Se o gestor tiver mais de 2 eventos cadastrados, simulamos um alerta de baixo estoque.
        if (count && count > 2) {
            console.log("[ProfileStatus] Manager has active low stock system notification.");
            return true;
        }
    }

    // Exemplo 2: Outras notificações de sistema (aqui iriam outras verificações)
    // ...

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

        if (isLoading || !profile) {
            if (!isLoading && !profile) {
                // Usuário logado, mas perfil não carregado (erro ou inicialização)
                setStatus({ isComplete: false, hasPendingNotifications: true, loading: false });
            }
            return;
        }

        const checkStatus = async () => {
            let hasPendingNotifications = false;
            let isComplete = true;

            // --- Lógica de Cliente (Tipo 3) ---
            if (profile.tipo_usuario_id === 3) {
                let missingEssential = false;
                let missingAddressDetail = false;

                // 1. Verificar campos essenciais (Nome, CPF, Data de Nascimento)
                for (const field of ESSENTIAL_FIELDS) {
                    const value = profile[field as keyof ProfileData];
                    if (isValueEmpty(value)) {
                        missingEssential = true;
                        break;
                    }
                }

                // 2. Verificar a consistência do endereço
                const cep = profile.cep ? String(profile.cep).replace(/\D/g, '') : null;
                const hasAnyAddressFieldFilled = ADDRESS_FIELDS_TO_CHECK.some(field => 
                    !isValueEmpty(profile[field as keyof ProfileData])
                );

                if (hasAnyAddressFieldFilled) {
                    if (!cep || cep.length !== 8 || isValueEmpty(profile.rua) || isValueEmpty(profile.numero)) {
                        missingAddressDetail = true;
                    }
                }

                isComplete = !missingEssential && !missingAddressDetail;
                hasPendingNotifications = !isComplete;
                
            } 
            // --- Lógica de Gestor (Tipo 1 ou 2) ---
            else if (profile.tipo_usuario_id === 1 || profile.tipo_usuario_id === 2) {
                // Para gestores, a notificação pendente é baseada em alertas de sistema (ex: baixo estoque)
                
                // 1. Buscar configurações do gestor
                const { data: settingsData } = await supabase
                    .from('manager_settings')
                    .select('low_stock_system')
                    .eq('user_id', profile.id)
                    .single();

                // 2. Verificar alertas de sistema (simulação)
                const settings = settingsData || {};
                hasPendingNotifications = await checkManagerSystemNotifications(profile.id, settings);
                
                // Para gestores, o perfil é considerado 'completo' se o perfil base estiver ok, mas focamos nas notificações de sistema
                isComplete = true; 
            }

            setStatus({
                isComplete: isComplete,
                hasPendingNotifications: hasPendingNotifications,
                loading: false,
            });
        };

        checkStatus();
    }, [profile, isLoading]);

    return status;
}