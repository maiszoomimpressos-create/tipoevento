import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from 'lucide-react';
import { showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import EventFormSteps from '@/components/EventFormSteps';
import { parseISO } from 'date-fns';
import { useManagerCompany } from '@/hooks/use-manager-company';

// Define the structure for the form data
interface EventFormData {
    title: string;
    description: string;
    date: Date | undefined;
    time: string;
    location: string;
    address: string;
    card_image_url: string; // RENOMEADO
    exposure_card_image_url: string; // NOVO
    banner_image_url: string;
    min_age: number | string;
    category: string;
    capacity: number | string;
    duration: string;
}

const ManagerEditEvent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [initialEventData, setInitialEventData] = useState<EventFormData | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchEventAndUser = async () => {
            setIsFetching(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                showError("Sessão expirada ou não autenticada.");
                navigate('/manager/login');
                return;
            }
            setUserId(user.id);

            if (!id) {
                showError("ID do evento não fornecido.");
                navigate('/manager/events');
                return;
            }

            // Fetch event data
            const { data: eventData, error: fetchError } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError || !eventData) {
                console.error("Erro ao buscar evento:", fetchError);
                showError("Evento não encontrado ou você não tem permissão para editá-lo.");
                navigate('/manager/events');
                return;
            }

            // Populate form data
            setInitialEventData({
                title: eventData.title || '',
                description: eventData.description || '',
                date: eventData.date ? parseISO(eventData.date) : undefined,
                time: eventData.time || '',
                location: eventData.location || '',
                address: eventData.address || '',
                card_image_url: eventData.image_url || '', // Mapeando image_url antigo para card_image_url
                exposure_card_image_url: eventData.exposure_card_image_url || '', // NOVO: Carrega o novo campo
                banner_image_url: eventData.banner_image_url || '',
                min_age: eventData.min_age || 0,
                category: eventData.category || '',
                capacity: eventData.capacity || 0,
                duration: eventData.duration || '',
            });
            setIsFetching(false);
        };

        fetchEventAndUser();
    }, [id, navigate]);

    const handleSaveSuccess = () => {
        navigate('/manager/events');
    };

    if (isFetching || !initialEventData || !userId) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-0 text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando detalhes do evento...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 mb-4 sm:mb-0">Editar Evento: {initialEventData.title}</h1>
                <Button 
                    onClick={() => navigate('/manager/events')}
                    variant="outline"
                    className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para a Lista
                </Button>
            </div>

            <EventFormSteps 
                eventId={id}
                initialData={initialEventData}
                onSaveSuccess={handleSaveSuccess} 
                onCancel={() => navigate('/manager/events')}
            />
        </div>
    );
};

export default ManagerEditEvent;