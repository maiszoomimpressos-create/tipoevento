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
    image_url: string; // Imagem do Card Principal (770x450)
    exposure_card_image_url: string | null; // NOVO: Imagem do Card de Exposição (400x200)
    banner_image_url: string | null; // Banner da tela do evento (900x500)
    min_age: number;
    category: string;
    capacity: number; // Adicionando capacidade
    duration: string; // Adicionando duração
    min_price: number | null; // NOVO: Preço mínimo calculado
    min_price_wristband_id: string | null; // NOVO: ID da pulseira mais barata
    
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

    // 1. Buscar detalhes do Evento, incluindo capacidade, duração, nome da empresa e novos campos de imagem
    const { data: eventDataRaw, error: eventError } = await supabase
        .from('events')
        .select(`
            id, title, description, date, time, location, address, image_url, exposure_card_image_url, banner_image_url, min_age, category, capacity, duration,
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
    const { data: wristbandsData, error: wristbandsError } = await supabase
        .from('wristbands')
        .select('id, access_type, price, status')
        .eq('event_id', eventId);

    if (wristbandsError) {
        console.error("Error fetching wristbands for event:", wristbandsError);
        throw new Error(wristbandsError.message);
    }
    
    // 3. Agrupar, formatar e calcular preço mínimo/disponibilidade
    let minPrice: number | null = null;
    let minPriceWristbandId: string | null = null;
    
    const groupedTickets = wristbandsData.reduce((acc, wristband) => {
        const price = parseFloat(wristband.price as unknown as string) || 0;
        
        // APENAS consideramos pulseiras ativas para venda e preço mínimo
        if (wristband.status === 'active') {
            const key = `${wristband.access_type}-${price}`;
            
            if (!acc[key]) {
                acc[key] = {
                    id: wristband.id, // Usamos o ID da primeira pulseira como ID do tipo (simplificação)
                    name: wristband.access_type,
                    price: price,
                    available: 0,
                    description: `Acesso ${wristband.access_type} para o evento.`,
                };
            }
            acc[key].available += 1;

            // Atualiza o preço mínimo
            if (minPrice === null || price < minPrice) {
                minPrice = price;
                minPriceWristbandId = wristband.id;
            }
        }
        return acc;
    }, {} as { [key: string]: TicketType });

    const ticketTypes = Object.values(groupedTickets).sort((a, b) => a.price - b.price);
    
    // 4. Combinar dados
    const event: EventData = {
        ...eventDataRaw,
        min_price: minPrice,
        min_price_wristband_id: minPriceWristbandId,
        exposure_card_image_url: eventDataRaw.exposure_card_image_url || null, // Mapeando o novo campo
        banner_image_url: eventDataRaw.banner_image_url || null, 
    } as EventData;


    return {
        event: event,
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