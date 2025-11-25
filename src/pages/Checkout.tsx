import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, ShoppingCart, CreditCard, CheckCircle, Calendar, Clock, MapPin, Users, UserCheck, UserTie } from 'lucide-react'; // Importando ícones adicionais
import { showSuccess, showError } from '@/utils/toast';
import { usePurchaseTicket } from '@/hooks/use-purchase-ticket';
import { useEventDetails } from '@/hooks/use-event-details'; // Importando o hook de detalhes do evento
import { Skeleton } from '@/components/ui/skeleton'; // Importando Skeleton para estados de carregamento

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    ticketTypeId: string; 
    eventId: string;
}

interface OrderState {
    eventName: string;
    totalTickets: number;
    totalPrice: number;
    items: OrderItem[];
}

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const order = location.state as OrderState;
    
    const { isLoading: isProcessing, purchaseTicket } = usePurchaseTicket();
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isOrderValid, setIsOrderValid] = useState(false);

    // Extrai o eventId do primeiro item do pedido (assumindo que todos os itens são do mesmo evento)
    const eventId = order?.items?.[0]?.eventId;
    const { details: eventDetails, isLoading: isLoadingEventDetails, isError: isErrorEventDetails } = useEventDetails(eventId);

    useEffect(() => {
        if (!order || !order.items || order.items.length === 0 || order.totalPrice <= 0) {
            showError("Pedido inválido ou vazio. Retorne à página do evento.");
            setIsOrderValid(false);
        } else {
            setIsOrderValid(true);
        }
    }, [order]);

    const handlePayment = async () => {
        if (!isOrderValid || !eventDetails) {
            showError("Não é possível processar um pedido inválido ou sem detalhes do evento.");
            return;
        }
        
        // 1. Simulação de validação de pagamento (Gateway)
        // ... (Aqui ocorreria a chamada ao gateway de pagamento)
        
        // 2. Processamento da Transação no Supabase (Associação de Ingressos)
        let success = true;
        
        for (const item of order.items) {
            const purchaseSuccess = await purchaseTicket({
                eventId: item.eventId,
                ticketTypeId: item.ticketTypeId,
                quantity: item.quantity,
                price: item.price,
            });
            
            if (!purchaseSuccess) {
                success = false;
                break;
            }
        }

        if (success) {
            setIsConfirmed(true);
        }
    };

    if (!isOrderValid) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center pt-20 px-4">
                <h1 className="text-4xl font-serif text-red-500 mb-4">Pedido Inválido</h1>
                <p className="text-xl text-gray-400 mb-6">Não foi possível carregar os detalhes do pedido.</p>
                <Button onClick={() => navigate('/')} className="bg-yellow-500 text-black hover:bg-yellow-600">
                    Voltar para a Home
                </Button>
            </div>
        );
    }

    if (isConfirmed) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
                <Card className="w-full max-w-lg bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-2xl shadow-2xl shadow-green-500/10 p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6 animate-fadeInUp" />
                    <CardTitle className="text-white text-3xl font-serif mb-4">Compra Concluída!</CardTitle>
                    <CardDescription className="text-gray-400 text-lg mb-6">
                        Seus ingressos foram enviados para o seu e-mail e estão disponíveis na seção "Meus Ingressos".
                    </CardDescription>
                    <div className="space-y-4">
                        <Button
                            onClick={() => navigate('/tickets')}
                            className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold"
                        >
                            Ver Meus Ingressos
                        </Button>
                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            className="w-full bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold"
                        >
                            Voltar para a Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Renderiza skeletons enquanto os detalhes do evento estão carregando
    if (isLoadingEventDetails) {
        return (
            <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-10 w-1/2 mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                        <div className="lg:col-span-1">
                            <Skeleton className="h-96 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Exibe erro se os detalhes do evento não puderem ser carregados
    if (isErrorEventDetails || !eventDetails) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center pt-20 px-4">
                <h1 className="text-4xl font-serif text-red-500 mb-4">Erro ao Carregar Evento</h1>
                <p className className="text-xl text-gray-400 mb-6">Não foi possível carregar os detalhes do evento.</p>
                <Button onClick={() => navigate('/')} className="bg-yellow-500 text-black hover:bg-yellow-600">
                    Voltar para a Home
                </Button>
            </div>
        );
    }

    const { event } = eventDetails;
    const organizerName = event.companies?.corporate_name || 'N/A';
    const capacityDisplay = event.capacity > 0 ? event.capacity.toLocaleString('pt-BR') : 'N/A';
    const durationDisplay = event.duration || 'N/A';

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl sm:text-4xl font-serif text-yellow-500 flex items-center">
                        <ShoppingCart className="h-8 w-8 mr-3" />
                        Finalizar Compra
                    </h1>
                    <Button 
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna de Detalhes do Evento (Esquerda) */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-0 overflow-hidden">
                            <div className="relative h-64 sm:h-80 overflow-hidden">
                                <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="w-full h-full object-cover object-center"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 flex flex-col justify-end">
                                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold mb-2 self-start">
                                        {event.category}
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-serif text-white leading-tight">
                                        {event.title}
                                    </h2>
                                </div>
                            </div>
                            <CardContent className="p-6 space-y-4">
                                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                    {event.description}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
                                        <span>Data: {new Date(event.date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                                        <span>Horário: {event.time}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-2 text-yellow-500" />
                                        <span>Local: {event.location}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-2 text-yellow-500" />
                                        <span>Capacidade: {capacityDisplay}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <UserCheck className="h-4 w-4 mr-2 text-yellow-500" />
                                        <span>Classificação: {event.min_age === 0 ? 'Livre' : `${event.min_age} anos`}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <UserTie className="h-4 w-4 mr-2 text-yellow-500" />
                                        <span>Organizador: {organizerName}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Informações do Comprador (Mock) */}
                        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                            <CardHeader className="p-0 mb-4 border-b border-yellow-500/20 pb-4">
                                <CardTitle className="text-white text-xl font-semibold">Dados do Comprador</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-3 text-sm text-gray-300">
                                <p>Nome: [Nome do Usuário Logado]</p>
                                <p>E-mail: [Email do Usuário Logado]</p>
                                <p>CPF: [CPF do Usuário Logado]</p>
                                <p className="text-yellow-500 pt-2">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    Certifique-se de que seu perfil está completo para a emissão correta do ingresso.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna de Resumo do Pedido e Pagamento (Direita) */}
                    <div className="lg:col-span-1">
                        <Card className="lg:sticky lg:top-24 bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-6">
                            <CardHeader className="p-0 mb-4 border-b border-yellow-500/20 pb-4">
                                <CardTitle className="text-white text-xl font-semibold flex items-center">
                                    <ShoppingCart className="h-5 w-5 mr-2 text-yellow-500" />
                                    Resumo do Pedido
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm sm:text-base">
                                        <span className="text-gray-300">{item.name} ({item.quantity}x)</span>
                                        <span className="text-white font-medium">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                ))}
                                <div className="border-t border-yellow-500/20 pt-4 flex justify-between items-center">
                                    <span className="text-white text-lg sm:text-xl font-semibold">Total a Pagar:</span>
                                    <span className="text-yellow-500 text-xl sm:text-2xl font-bold">R$ {order.totalPrice.toFixed(2).replace('.', ',')}</span>
                                </div>
                            </CardContent>

                            <CardTitle className="text-white text-xl font-semibold flex items-center pt-4 border-t border-yellow-500/20">
                                <CreditCard className="h-5 w-5 mr-2 text-yellow-500" />
                                Método de Pagamento
                            </CardTitle>
                            
                            {/* Mock de Formulário de Pagamento */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Número do Cartão</label>
                                    <Input placeholder="**** **** **** 4242" disabled className="bg-black/60 border-yellow-500/30 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Nome no Cartão</label>
                                    <Input placeholder="Nome Completo" disabled className="bg-black/60 border-yellow-500/30 text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Validade</label>
                                        <Input placeholder="MM/AA" disabled className="bg-black/60 border-yellow-500/30 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">CVV</label>
                                        <Input placeholder="***" disabled className="bg-black/60 border-yellow-500/30 text-white" />
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Processando Pagamento...
                                    </div>
                                ) : (
                                    `Pagar R$ ${order.totalPrice.toFixed(2).replace('.', ',')}`
                                )}
                            </Button>
                            
                            <div className="text-center text-xs text-gray-500">
                                Ao clicar em Pagar, você concorda com os Termos de Serviço.
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;