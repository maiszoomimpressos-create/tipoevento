import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileData } from './use-profile';

interface UseProfileStatusReturn {
    hasPendingNotifications: boolean;
    loading: boolean;
}

/**
 * Hook para verificar o status do perfil e notificações pendentes
 * 
 * Para Clientes (tipo_usuario_id = 3):
 * - Verifica se o perfil está incompleto (falta RG, endereço, etc.)
 * 
 * Para Gestores (tipo_usuario_id = 1 ou 2):
 * - Verifica se há notificações de sistema (ex: baixo estoque)
 */
export const useProfileStatus = (
    profile: ProfileData | null | undefined,
    isLoadingProfile: boolean
): UseProfileStatusReturn => {
    const [userId, setUserId] = useState<string | null>(null);
    const [hasPendingNotifications, setHasPendingNotifications] = useState(false);
    const [loading, setLoading] = useState(true);

    // Busca o userId da sessão
    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id || null);
        });
    }, []);

    useEffect(() => {
        if (isLoadingProfile) {
            setLoading(true);
            return;
        }

        if (!profile || !userId) {
            setHasPendingNotifications(false);
            setLoading(false);
            return;
        }

        const checkStatus = async () => {
            try {
                // Para Clientes (tipo 3): verifica se o perfil está incompleto
                if (profile.tipo_usuario_id === 3) {
                    // Verifica se falta informações essenciais para se tornar gestor
                    const isIncomplete = !profile.rg || !profile.rua || !profile.cidade || !profile.estado || !profile.cep;
                    setHasPendingNotifications(isIncomplete);
                } 
                // Para Gestores (tipo 1 ou 2): verifica notificações de sistema
                else if (profile.tipo_usuario_id === 1 || profile.tipo_usuario_id === 2) {
                    // Busca eventos com baixo estoque (menos de 10% dos ingressos disponíveis)
                    const { data: events, error } = await supabase
                        .from('events')
                        .select('id, capacity, tickets_sold')
                        .eq('created_by', userId)
                        .eq('status', 'active');

                    if (error) {
                        console.error('Erro ao buscar eventos:', error);
                        setHasPendingNotifications(false);
                    } else if (events && events.length > 0) {
                        // Verifica se algum evento tem menos de 10% de ingressos disponíveis
                        const hasLowStock = events.some(event => {
                            const available = event.capacity - (event.tickets_sold || 0);
                            const percentage = (available / event.capacity) * 100;
                            return percentage < 10 && percentage > 0;
                        });
                        setHasPendingNotifications(hasLowStock);
                    } else {
                        setHasPendingNotifications(false);
                    }
                } else {
                    setHasPendingNotifications(false);
                }
            } catch (error) {
                console.error('Erro ao verificar status do perfil:', error);
                setHasPendingNotifications(false);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [profile, isLoadingProfile, userId]);

    return {
        hasPendingNotifications,
        loading
    };
};

