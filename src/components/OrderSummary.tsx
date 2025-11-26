import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ticket, DollarSign, Calendar, MapPin } from 'lucide-react';

interface TicketItem {
    ticketId: string;
    quantity: number;
    price: number;
    name: string;
}

interface OrderSummaryProps {
    tickets: TicketItem[];
    totalPrice: number;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ tickets, totalPrice, eventTitle, eventDate, eventLocation }) => {
    return (
        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 h-full">
            <CardHeader className="border-b border-yellow-500/20">
                <CardTitle className="text-white text-xl font-semibold flex items-center">
                    <Ticket className="h-6 w-6 mr-3 text-yellow-500" />
                    Resumo do Pedido
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                    Verifique os detalhes dos seus ingressos antes de finalizar.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                
                {/* Detalhes do Evento */}
                <div className="space-y-2 pb-4 border-b border-yellow-500/10">
                    <h4 className="text-lg font-semibold text-yellow-500">{eventTitle}</h4>
                    <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {eventDate}
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        {eventLocation}
                    </div>
                </div>

                {/* Lista de Ingressos */}
                <div className="space-y-4">
                    <h5 className="text-white font-medium text-base">Itens:</h5>
                    {tickets.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">{item.name} ({item.quantity}x)</span>
                            <span className="text-white font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-yellow-500/20">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold text-white flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-yellow-500" />
                            Total
                        </span>
                        <span className="text-3xl font-bold text-yellow-500">
                            R$ {totalPrice.toFixed(2).replace('.', ',')}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrderSummary;