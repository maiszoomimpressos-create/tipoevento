import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface PublicEvent {
    id: string;
    title: string;
    description: string;
    date: string; // Keep as string for display
    raw_date: Date; // New: raw Date object for comparison
    time: string;
    location: string;
    image_url: string; // RENOMEADO: Agora é a URL da imagem do Card de Exposição (400x200)
    category: string;
    min_price: number | null; // Preço mínimo calculado
    min_price_wristband_id: string | null;
    total_available_tickets: number; // New: total count of active wristbands for the event
    capacity: number; // New: event capacity from the 'events' table
}

const fetchPublicEvents = async (): Promise<PublicEvent[]> => {
    // 1. Buscar todos os eventos com capacidade
    const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
            id, title, description, date, time, location, exposure_card_image_url, category, capacity
        `)
        .order('date', { ascending: true });

    if (eventsError) {
        console.error("Error fetching public events:", eventsError);
        throw new Error(eventsError.message);
    }
    
    const eventIds = eventsData.map(e => e.id);
    
    // 2. Buscar o preço mínimo e o ID da pulseira, e contar a disponibilidade para todos os eventos
    const { data: wristbandsData, error: wristbandsError } = await supabase
        .from('wristbands')
        .select('event_id, id, price, status')
        .in('event_id', eventIds); // Fetch all wristbands for these events

    if (wristbandsError) {
        console.error("Error fetching wristband data:", wristbandsError);
        // Continue without wristband data if there's an error
    }
    
    const eventAggregates = wristbandsData ? wristbandsData.reduce((acc, item) => {
        if (!acc[item.event_id]) {
            acc[item.event_id] = { min_price: Infinity, min_price_wristband_id: null, total_available_tickets: 0 };
        }

        const price = parseFloat(item.price as unknown as string) || 0; 
        
        // APENAS pulseiras 'active' são consideradas disponíveis para compra e cálculo de preço mínimo
        if (item.status === 'active') {
            if (price < acc[item.event_id].min_price) {
                acc[item.event_id].min_price = price;
                acc[item.event_id].min_price_wristband_id = item.id;
            }
            acc[item.event_id].total_available_tickets += 1;
        }
        return acc;
    }, {} as { [eventId: string]: { min_price: number; min_price_wristband_id: string | null; total_available_tickets: number } }) : {};

    // 3. Combinar dados e formatar
    return eventsData.map(event => {
        const aggregates = eventAggregates[event.id] || { min_price: Infinity, min_price_wristband_id: null, total_available_tickets: 0 };
        const minPrice = aggregates.min_price === Infinity ? null : aggregates.min_price;

        return {
            id: event.id,
            title: event.title,
            description: event.description,
            date: new Date(event.date).toLocaleDateString('pt-BR'),
            raw_date: new Date(event.date), // Store raw date
            time: event.time,
            location: event.location,
            image_url: event.exposure_card_image_url, // USANDO O NOVO CAMPO PARA O CARD DE EXPOSIÇÃO
            category: event.category,
            min_price: minPrice,
            min_price_wristband_id: aggregates.min_price_wristband_id,
            total_available_tickets: aggregates.total_available_tickets,
            capacity: event.capacity,
        };
    });
};

export const usePublicEvents = () => {
    const query = useQuery({
        queryKey: ['publicEvents'],
        queryFn: fetchPublicEvents,
        staleTime: 1000 * 60 * 5, // 5 minutes
        onError: (error) => {
            console.error("Query Error: Failed to load public events.", error);
            showError("Erro ao carregar a lista de eventos.");
        }
    });

    return {
        ...query,
        events: query.data || [],
    };
};