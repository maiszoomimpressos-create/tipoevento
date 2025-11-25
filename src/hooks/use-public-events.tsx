import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface PublicEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image_url: string;
    category: string;
    min_price: number | null; // Preço mínimo calculado
}

const fetchPublicEvents = async (): Promise<PublicEvent[]> => {
    // 1. Buscar todos os eventos
    const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

    if (eventsError) {
        console.error("Error fetching public events:", eventsError);
        throw new Error(eventsError.message);
    }
    
    const eventIds = eventsData.map(e => e.id);
    
    // 2. Buscar o preço mínimo para todos os eventos em uma única query
    // Agrupamos por event_id e encontramos o preço mínimo das pulseiras ativas.
    const { data: minPricesData, error: pricesError } = await supabase
        .from('wristbands')
        .select('event_id, price')
        .in('event_id', eventIds)
        .eq('status', 'active');

    if (pricesError) {
        console.error("Error fetching wristband prices:", pricesError);
        // Não lançamos erro aqui, apenas continuamos sem preços se falhar
    }
    
    const minPricesMap = minPricesData ? minPricesData.reduce((acc, item) => {
        if (!acc[item.event_id] || item.price < acc[item.event_id]) {
            acc[item.event_id] = item.price;
        }
        return acc;
    }, {} as { [eventId: string]: number }) : {};

    // 3. Combinar dados e formatar
    return eventsData.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: new Date(event.date).toLocaleDateString('pt-BR'), // Formatando a data para exibição
        time: event.time,
        location: event.location,
        image_url: event.image_url,
        category: event.category,
        min_price: minPricesMap[event.id] || null,
    }));
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