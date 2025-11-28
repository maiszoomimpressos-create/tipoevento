import { useState, useEffect } from 'react';
import { ProfileData } from './use-profile';
import { supabase } from '@/integrations/supabase/client';

interface ProfileStatus {
    isComplete: boolean;
    hasPendingNotifications: boolean;
    loading: boolean;
    needsCompanyProfile: boolean; // Indica se um gestor PJ precisa criar um perfil de empresa
    needsPersonalProfileCompletion: boolean; // Indica se um gestor (PF ou PJ) precisa completar o perfil pessoal
}

// Export this function so Profile.tsx can use it for consistency
export const isValueEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue === '') return true;
        // Check common date/document placeholders that might have been saved
        if (trimmedValue === '0000-00-00' || trimmedValue === '00.000.000-0' || trimmedValue === '00.000.000' || trimmedValue === '000.000.000-00' || trimmedValue === '00000-000') return true;
    }
    // For numbers, 0 is a valid value, so it's not empty.
    if (typeof value === 'number' && value === 0) return false;
    return false;
};

// Essential fields for a manager's personal profile (Admin Master or Manager PRO)
const ESSENTIAL_MANAGER_PERSONAL_PROFILE_FIELDS = [
    'first_name', 'last_name', 'cpf', 'rg', 'birth_date', 'gender',
    'cep', 'rua', 'bairro', 'cidade', 'estado', 'numero'
];

// Essential fields for a company profile (for Manager PRO - PJ)
const ESSENTIAL_COMPANY_PROFILE_FIELDS = [
    'cnpj', 'corporate_name', 'phone', 'email',
    'cep', 'street', 'neighborhood', 'city', 'state', 'number'
];

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
        // Esta é uma simulação. Na vida real, você buscaria eventos reais e calcularia o estoque.
        // Para fins de demonstração, se o gestor tiver mais de 2 eventos, ativamos o alerta.
        const { count, error } = await supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        if (error) {
            console.error("Error checking manager events for low stock simulation:", error);
            return false;
        }

        if (count && count > 2) { // Arbitrary condition for "low stock" notification
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
        needsCompanyProfile: false,
        needsPersonalProfileCompletion: false,
    });

    useEffect(() => {
        setStatus(prev => ({ ...prev, loading: isLoading }));

        if (isLoading) return;

        if (!profile) {
            // If no profile, it's not a manager or not logged in, so no special status needed.
            setStatus({ isComplete: true, hasPendingNotifications: false, loading: false, needsCompanyProfile: false, needsPersonalProfileCompletion: false });
            return;
        }

        const checkStatus = async () => {
            let hasPendingNotifications = false;
            let isComplete = true;
            let needsCompanyProfile = false;
            let needsPersonalProfileCompletion = false;

            // Check personal profile completeness for managers (Admin Master or Manager PRO)
            if (profile.tipo_usuario_id === 1 || profile.tipo_usuario_id === 2) {
                for (const field of ESSENTIAL_MANAGER_PERSONAL_PROFILE_FIELDS) {
                    const value = profile[field as keyof ProfileData];
                    if (isValueEmpty(value)) {
                        isComplete = false;
                        needsPersonalProfileCompletion = true;
                        console.log(`[ProfileStatus] Manager personal profile incomplete: Missing field '${field}'`);
                        break;
                    }
                }

                // If it's a Manager PRO (tipo_usuario_id = 2), also check for company profile
                if (profile.tipo_usuario_id === 2) {
                    const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('user_id', profile.id)
                        .limit(1);

                    if (companyError && companyError.code !== 'PGRST116') {
                        console.error("[ProfileStatus] Error fetching company data:", companyError);
                        isComplete = false; // Treat as incomplete if there's an error fetching company data
                    } else if (!companyData || companyData.length === 0) {
                        needsCompanyProfile = true;
                        isComplete = false;
                        console.log("[ProfileStatus] Manager PRO needs to create company profile.");
                    } else {
                        // Check company profile fields if company exists
                        const companyProfile = companyData[0];
                        for (const field of ESSENTIAL_COMPANY_PROFILE_FIELDS) {
                            const value = companyProfile[field as keyof typeof companyProfile];
                            if (isValueEmpty(value)) {
                                isComplete = false;
                                console.log(`[ProfileStatus] Manager company profile incomplete: Missing field '${field}'`);
                                break;
                            }
                        }
                    }
                }
            }
            // For clients (tipo_usuario_id = 3), profile is always considered complete
            else if (profile.tipo_usuario_id === 3) {
                isComplete = true;
            }

            // Check for manager system notifications (independent of profile completeness)
            if (profile.tipo_usuario_id === 1 || profile.tipo_usuario_id === 2) {
                hasPendingNotifications = await checkManagerSystemNotifications(profile.id);
            }

            console.log(`[ProfileStatus] Final State - Profile Complete: ${isComplete}. Needs Personal: ${needsPersonalProfileCompletion}. Needs Company: ${needsCompanyProfile}. Notifications Active: ${hasPendingNotifications}`);

            setStatus({
                isComplete: isComplete,
                hasPendingNotifications: hasPendingNotifications,
                loading: false,
                needsCompanyProfile: needsCompanyProfile,
                needsPersonalProfileCompletion: needsPersonalProfileCompletion,
            });
        };

        checkStatus();
    }, [profile, isLoading]);

    return status;
}