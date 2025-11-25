import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

// Estrutura de dados do Evento (simplificada)
export interface EventData {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    address: string;
    image_url: string;
    min_age: number;
    category: string;
    capacity: number; // Adicionando capacidade
    duration: string; // Adicionando duração
    highlights: string | null; // NOVO: Destaques do evento
    
    // Dados do Organizador (JOIN)
    companies: {
        corporate_name: string;
    } | null;
}

// Estrutura de dados do Tipo de Ingresso (baseado em pulseiras)
export interface TicketType {
    id: string; // ID da pulseira (wristband_id)
    name: string; // Nome do tipo de acesso (access_type)
    price: number;
    available: number; // Simulação de disponibilidade (contagem de pulseiras ativas)
    description: string; // Descrição do tipo de acesso
}

// Estrutura de dados agrupada para a tela de detalhes
export interface EventDetailsData {
    event: EventData;
    ticketTypes: TicketType[];
}

const fetchEventDetails = async (eventId: string): Promise<EventDetailsData | null> => {
    if (!eventId) return null;

    // 1. Buscar detalhes do Evento, incluindo capacidade, duração, destaques e o nome da empresa organizadora
    const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
            id, title, description, date, time, location, address, image_url, min_age, category, capacity, duration, highlights,
            companies (corporate_name)
        `)
        .eq('id', eventId)
        .single();

    if (eventError) {
        if (eventError.code === 'PGRST116') { // No rows found
            return null;
        }
        console.error("Error fetching event details:", eventError);
        throw new Error(eventError.message);
    }
    
    // 2. Buscar Tipos de Pulseira (Wristbands) associados a este evento
    // Agrupamos por access_type e contamos o número de pulseiras ativas e o preço.
    
    const { data: wristbandsData, error: wristbandsError } = await supabase
        .from('wristbands')
        .select('id, access_type, price, status')
        .eq('event_id', eventId)
        .eq('status', 'active'); // Apenas pulseiras ativas estão 'disponíveis'

    if (wristbandsError) {
        console.error("Error fetching wristbands for event:", wristbandsError);
        throw new Error(wristbandsError.message);
    }
    
    // 3. Agrupar e formatar os tipos de ingresso
    const groupedTickets = wristbandsData.reduce((acc, wristband) => {
        const key = `${wristband.access_type}-${wristband.price}`;
        
        if (!acc[key]) {
            acc[key] = {
                id: wristband.id, // Usamos o ID da primeira pulseira como ID do tipo (simplificação)
                name: wristband.access_type,
                price: wristband.price,
                available: 0,
                description: `Acesso ${wristband.access_type} para o evento.`,
            };
        }
        acc[key].available += 1;
        return acc;
    }, {} as { [key: string]: TicketType });

    const ticketTypes = Object.values(groupedTickets).sort((a, b) => a.price - b.price);

    return {
        event: eventData as EventData,
        ticketTypes: ticketTypes,
    };
};

export const useEventDetails = (eventId: string | undefined) => {
    const query = useQuery({
        queryKey: ['eventDetails', eventId],
        queryFn: () => fetchEventDetails(eventId!),
        enabled: !!eventId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        onError: (error) => {
            console.error("Query Error: Failed to load event details.", error);
            showError("Erro ao carregar detalhes do evento. Tente recarregar.");
        }
    });

    return {
        ...query,
        details: query.data,
    };
};