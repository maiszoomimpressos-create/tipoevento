import { eventSlides } from './events';

interface PurchasedTicket {
    id: number;
    eventId: number;
    eventName: string;
    ticketType: string;
    price: number;
    quantity: number;
    date: string;
    location: string;
    qrCodeUrl: string;
    status: 'active' | 'used' | 'cancelled';
}

const getEventDetails = (eventId: number) => {
    const event = eventSlides.find(e => e.id === eventId);
    return {
        eventName: event?.title || 'Evento Desconhecido',
        location: event?.location || 'Local Desconhecido',
        date: event?.date || 'Data Desconhecida',
    };
};

export const purchasedTickets: PurchasedTicket[] = [
    {
        id: 101,
        eventId: 1,
        ...getEventDetails(1),
        ticketType: 'Plateia Premium',
        price: 280,
        quantity: 2,
        qrCodeUrl: 'https://via.placeholder.com/150?text=QR101',
        status: 'active',
    },
    {
        id: 102,
        eventId: 4,
        ...getEventDetails(4),
        ticketType: 'Premium com Harmonização',
        price: 650,
        quantity: 1,
        qrCodeUrl: 'https://via.placeholder.com/150?text=QR102',
        status: 'active',
    },
    {
        id: 103,
        eventId: 7,
        ...getEventDetails(7),
        ticketType: 'Standard',
        price: 500,
        quantity: 3,
        qrCodeUrl: 'https://via.placeholder.com/150?text=QR103',
        status: 'used',
    },
];