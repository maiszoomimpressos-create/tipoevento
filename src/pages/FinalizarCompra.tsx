import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, ShoppingCart } from 'lucide-react';
import CheckoutForm from '@/components/CheckoutForm';
import OrderSummary from '@/components/OrderSummary';
import CheckoutImageBanner from '@/components/CheckoutImageBanner';
import { useEventDetails } from '@/hooks/use-event-details';
import { Loader2 } from 'lucide-react';
import { showError } from '@/utils/toast';

interface TicketItem {
    ticketId: string;
    quantity: number;
    price: number;
    name: string;
}

interface LocationState {
    eventId: string;
    tickets: TicketItem[];
    totalPrice: number;
}

const FinalizarCompra: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;
    
    const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);

    // Validação inicial dos dados
    useEffect(() => {
        if (!state || !state.eventId || !state.tickets || state.totalPrice === undefined) {
            showError("Dados de compra incompletos ou inválidos.");
            navigate('/', { replace: true });
        }
    }, [state, navigate]);

    const { details, isLoading: isLoadingEvent } = useEventDetails(state?.eventId);

    if (!state || !state.eventId) {
        return null; // Redirecionamento já foi acionado no useEffect
    }
    
    if (isLoadingEvent) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (!details) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center p-8">
                    <h1 className="text-3xl font-serif text-red-500 mb-4">Evento Não Encontrado</h1>
                    <p className="text-gray-400">Não foi possível carregar os detalhes do evento para finalizar a compra.</p>
                    <Button 
                        onClick={() => navigate('/')}
                        className="mt-6 bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                        Voltar para a Home
                    </Button>
                </div>
            </div>
        );
    }
    
    const eventTitle = details.event.title;
    const eventDate = new Date(details.event.date).toLocaleDateString('pt-BR');
    const eventLocation = details.event.location;

    const handlePaymentSuccess = () => {
        setIsPaymentSuccessful(true);
        // Aqui você pode adicionar a lógica real de confirmação de ingressos no DB, se necessário.
    };

    return (
        <div className="min-h-screen bg-black text-white pt-20 pb-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl sm:text-4xl font-serif text-yellow-500 flex items-center">
                        <ShoppingCart className="h-8 w-8 mr-3" />
                        Finalizar Compra
                    </h1>
                    <Button 
                        onClick={() => navigate(`/events/${state.eventId}`)}
                        variant="outline"
                        className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Evento
                    </Button>
                </div>
                
                <CheckoutImageBanner />

                {isPaymentSuccessful ? (
                    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-2xl shadow-2xl shadow-green-500/10 p-8 text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                        <CardTitle className="text-white text-3xl font-semibold mb-2">Compra Concluída!</CardTitle>
                        <p className="text-gray-300 text-lg mb-6">
                            Parabéns! Seus ingressos para "{eventTitle}" foram confirmados.
                            Você pode visualizá-los na seção "Meus Ingressos".
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <Button 
                                onClick={() => navigate('/tickets')}
                                className="bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold"
                            >
                                <Ticket className="h-5 w-5 mr-2" />
                                Ver Meus Ingressos
                            </Button>
                            <Button 
                                onClick={() => navigate('/')}
                                variant="outline"
                                className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold"
                            >
                                Explorar Mais Eventos
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Coluna Principal: Formulário de Pagamento */}
                        <div className="lg:col-span-2">
                            <CheckoutForm 
                                totalPrice={state.totalPrice} 
                                onPaymentSuccess={handlePaymentSuccess}
                            />
                        </div>
                        
                        {/* Coluna Lateral: Resumo do Pedido */}
                        <div className="lg:col-span-1">
                            <OrderSummary 
                                tickets={state.tickets} 
                                totalPrice={state.totalPrice} 
                                eventTitle={eventTitle}
                                eventDate={eventDate}
                                eventLocation={eventLocation}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinalizarCompra;