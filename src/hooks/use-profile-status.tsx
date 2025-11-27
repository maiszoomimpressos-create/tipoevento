import { useState, useEffect } from 'react';
import { ProfileData } from './use-profile';
import { supabase } from '@/integrations/supabase/client';

interface ProfileStatus {
    isComplete: boolean;
    hasPendingNotifications: boolean;
    loading: boolean;
}

// Export this function so Profile.tsx can use it for consistency
export const isValueEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue === '') return true;
        // Verifica placeholders comuns de data/documentos que podem ter sido salvos
        if (trimmedValue === '0000-00-00' || trimmedValue === '00.000.000-0' || trimmedValue === '00000-000') return true;
    }
    return false;
};

// Simulação de verificação de notificações de sistema para Gestores
const checkManagerSystemNotifications = async (userId: string): Promise<boolean> => {
    // Fetch manager settings for system notifications
    const { data: settingsArray, error: settingsError } = await supabase
        .from('manager_settings')
        .select('low_stock_system')
        .eq('user_id', userId) 
        .limit(1);

    let settings = {};
    if (settingsError) {
        console.error(`[ProfileStatus] Error fetching manager settings for user ${userId}:`, settingsError);
        if (settingsError.code !== 'PGRST116' && settingsError.code !== '406') { 
            console.warn(`[ProfileStatus] Unexpected error code ${settingsError.code} for manager settings. Treating as no settings configured.`);
        }
    } else if (settingsArray && settingsArray.length > 0) {
        settings = settingsArray[0];
        console.log(`[ProfileStatus] Manager settings fetched for user ${userId}:`, settings);
    } else {
        console.log(`[ProfileStatus] No manager settings found for user ${userId}.`);
    }

    // Exemplo 1: Alerta de Baixo Estoque (se a configuração estiver ativa)
    if ((settings as any).low_stock_system) {
        const { count, error } = await supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        if (error) {
            console.error("Error checking manager events for low stock simulation:", error);
            return false;
        }

        if (count && count > 2) {
            console.log("[ProfileStatus] Manager has active low stock system notification.");
            return true;
        }
    }

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
            setStatus({ isComplete: true, hasPendingNotifications: false, loading: false }); // Perfil não encontrado, mas não é uma restrição
            return;
        }

        const checkStatus = async () => {
            let hasPendingNotifications = false;
            let isComplete = true; // Sempre true, pois não há mais exigências de completude

            // Apenas verifica notificações de sistema para gestores, independentemente do preenchimento do perfil
            if (profile.tipo_usuario_id === 1 || profile.tipo_usuario_id === 2) {
                hasPendingNotifications = await checkManagerSystemNotifications(profile.id);
            }

            console.log(`[ProfileStatus] Final State - Profile Complete: ${isComplete}. Notifications Active: ${hasPendingNotifications}`);

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