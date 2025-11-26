import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import EventBanner from '@/components/EventBanner';
import CheckoutImageBanner from '@/components/CheckoutImageBanner';

// Tipos de dados mockados para manter a estrutura de renderização
interface TicketPurchase {
    ticketId: string;
    quantity: number;
    price: number;
    name: string;
}

interface EventDataMock {
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
    capacity: number;
    duration: string;
    companies: { corporate_name: string; } | null;
}

// Helper function to get the price display
const getPriceDisplay = (price: number): string => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

const FinalizarCompra: React.FC = () => {
    const navigate = useNavigate();
    
    // Dados mockados para garantir que a renderização não quebre após a remoção da lógica
    const event: EventDataMock = {
        id: 'mock-id',
        title: 'Evento de Teste Premium',
        description: 'Descrição mockada para a tela de checkout.',
        date: '2025-12-31',
        time: '20:00',
        location: 'Local de Teste',
        address: 'Endereço de Teste, 123',
        image_url: 'https://readdy.ai/api/search-image?query=luxury%20music%20concert%20stage%20with%20golden%20lighting%20effects%20and%20black%20elegant%20backdrop%2C%20premium%20entertainment%20venue%20with%20sophisticated%20atmosphere%20and%20dramatic%20illumination&width=1200&height=400&seq=banner1&orientation=landscape',
        min_age: 18,
        category: 'Teste',
        capacity: 100,
        duration: '3 horas',
        companies: { corporate_name: 'Empresa Teste' },
    };
    
    const ticketsToPurchase: TicketPurchase[] = [
        { ticketId: 'mock-1', quantity: 2, price: 150.00, name: 'Ingresso VIP' },
        { ticketId: 'mock-2', quantity: 1, price: 80.00, name: 'Ingresso Standard' },
    ];
    
    const totalPrice = ticketsToPurchase.reduce((total, t) => total + t.price * t.quantity, 0);
    const minPriceDisplay = getPriceDisplay(totalPrice);

    return (
        <div className="bg-black text-white">
            {/* Componente de Banner no Topo */}
            <EventBanner event={event} minPriceDisplay={minPriceDisplay} showActionButton={false} />
            
            {/* Conteúdo principal da finalização de compra */}
            <main className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-serif text-yellow-500">Finalizar Compra</h2>
                    <Button 
                        onClick={() => navigate(`/events/${event.id}`)}
                        variant="outline"
                        className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Evento
                    </Button>
                </div>
                
                {/* NOVO COMPONENTE DE IMAGEM */}
                <CheckoutImageBanner />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Coluna 1: Resumo da Compra */}
                    <div className="lg:col-span-1">
                        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
                            <CardHeader className="p-0 mb-4">
                                <CardTitle className="text-white text-xl">Resumo do Pedido</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-4">
                                <div className="space-y-3 border-b border-yellow-500/20 pb-4">
                                    {ticketsToPurchase.map((ticket, index) => (
                                        <div key={index} className="flex justify-between text-sm text-gray-300">
                                            <span className="truncate max-w-[70%]">{ticket.quantity}x {ticket.name}</span>
                                            <span className="text-white font-medium">{getPriceDisplay(ticket.price * ticket.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-white text-lg">Total:</span>
                                    <span className="text-yellow-500 text-2xl font-bold">{getPriceDisplay(totalPrice)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Coluna 2: Detalhes do Pagamento (Placeholder) */}
                    <div className="lg:col-span-2">
                        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
                            <CardHeader className="p-0 mb-6">
                                <CardTitle className="text-white text-xl">Informações de Pagamento</CardTitle>
                                <CardDescription className="text-gray-400 text-sm">Selecione o método de pagamento e finalize a compra.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-6">
                                <div className="bg-black/60 p-4 rounded-xl border border-yellow-500/20 text-center text-gray-400">
                                    <i className="fas fa-credit-card text-3xl mb-3 text-yellow-500"></i>
                                    <p>Formulário de pagamento e integração com gateway serão implementados aqui.</p>
                                </div>
                                <Button
                                    className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105"
                                    onClick={() => alert("Simulando finalização de compra...")}
                                >
                                    Finalizar Compra Segura
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FinalizarCompra;