import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, Clock, Users, UserCheck, User, Shield, ArrowLeft, Search } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useEventDetails, EventDetailsData, TicketType } from '@/hooks/use-event-details';
import EventBanner from '@/components/EventBanner';
import { usePurchaseTicket } from '@/hooks/use-purchase-ticket';
import { Input } from '@/components/ui/input';
import { useAuthRedirect } from '@/hooks/use-auth-redirect'; // Importando o novo hook

// Helper function to get the minimum price display
const getMinPriceDisplay = (ticketTypes: TicketType[]): string => {
    if (!ticketTypes || ticketTypes.length === 0) return 'Sem ingressos ativos';
    const minPrice = Math.min(...ticketTypes.map(t => t.price));
    // Formata para R$ X.XX, sem centavos
    return `A partir de R$ ${minPrice.toFixed(0)}`; 
};

const EventDetails: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>(); 
    
    const { details, isLoading, isError } = useEventDetails(id);
    const { isLoading: isPurchasing, purchaseTicket } = usePurchaseTicket();
    const { isAuthenticated, redirectToLogin } = useAuthRedirect();

    // Inicializa o estado dos ingressos a partir do estado de navegação (se houver)
    const initialSelectedTickets = location.state?.selectedTickets || {};
    const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>(initialSelectedTickets);

    // Limpa o estado de navegação após a montagem para evitar loops de re-renderização
    useEffect(() => {
        if (location.state?.selectedTickets) {
            // Remove o estado de navegação após usá-lo
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, location.pathname, navigate]);


    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center pt-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (isError || !details?.event) {
        return (
            <div className="min-h-screen bg-black text-white pt-20 px-4">
                <div className="max-w-4xl mx-auto py-10">
                    <Card className="bg-black/80 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center">
                        <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
                        <h1 className="text-2xl font-serif text-white mb-2">Evento Não Encontrado</h1>
                        <p className="text-gray-400 mb-6">O evento que você está procurando não existe, foi removido ou o ID é inválido.</p>
                        <Button 
                            onClick={() => navigate('/')}
                            className="bg-yellow-500 text-black hover:bg-yellow-600"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar para a Home
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    const { event, ticketTypes } = details;
    
    const handleTicketChange = (ticketId: string, quantity: number) => {
        setSelectedTickets(prev => ({
            ...prev,
            [ticketId]: Math.max(0, quantity)
        }));
    };

    const getTotalPrice = () => {
        return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
            const ticket = ticketTypes.find(t => t.id === ticketId);
            return total + (ticket ? ticket.price * quantity : 0);
        }, 0);
    };

    const getTotalTickets = () => {
        return Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0);
    };
    
    const handleCheckout = async () => {
        const totalTickets = getTotalTickets();
        if (totalTickets === 0) {
            showError("Selecione pelo menos um ingresso para continuar.");
            return;
        }
        
        // 1. VERIFICAÇÃO DE AUTENTICAÇÃO
        if (!isAuthenticated) {
            // Salva o estado atual dos ingressos selecionados antes de redirecionar
            redirectToLogin({ selectedTickets });
            return;
        }
        
        // 2. LÓGICA DE COMPRA (Se autenticado)
        
        // Prepara os itens para o Mercado Pago
        const purchaseItems = Object.entries(selectedTickets)
            .filter(([, quantity]) => quantity > 0)
            .map(([ticketId, quantity]) => {
                const ticketDetails = ticketTypes.find(t => t.id === ticketId);
                
                if (!ticketDetails) {
                    throw new Error(`Detalhes do ingresso ${ticketId} não encontrados.`);
                }

                return {
                    ticketTypeId: ticketId,
                    quantity: quantity,
                    price: ticketDetails.price,
                    name: `${event.title} - ${ticketDetails.name}`,
                };
            });

        try {
            const result = await purchaseTicket({
                eventId: event.id, // UUID do evento
                purchaseItems: purchaseItems,
            });
            
            if (result && result.checkoutUrl) {
                showSuccess("Redirecionando para o pagamento...");
                // Redireciona o usuário para o checkout do Mercado Pago
                window.location.href = result.checkoutUrl;
            } else {
                showError("Falha ao gerar o link de pagamento. Verifique as configurações do gestor.");
            }
        } catch (e: any) {
            console.error("Erro durante o processamento de checkout:", e);
            showError(e.message || "Ocorreu um erro ao processar a compra.");
        }
    };

    const minPriceDisplay = getMinPriceDisplay(ticketTypes);
    const classificationDisplay = event.min_age === 0 ? 'Livre' : `${event.min_age} anos`;
    const organizerName = event.companies?.corporate_name || 'Organizador Desconhecido';

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            
            {/* 1. Cabeçalho do Evento (Banner) */}
            <EventBanner 
                event={event} 
                minPriceDisplay={minPriceDisplay} 
                showActionButton={false} // O botão principal está na sidebar
            />
            
            {/* Linha divisória */}
            <div className="w-full h-px bg-yellow-500/20"></div>
            
            <section className="py-12 sm:py-20 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        
                        {/* Coluna Principal (Detalhes) */}
                        <div className="lg:col-span-2 space-y-8 sm:space-y-12 order-2 lg:order-1">
                            
                            {/* 2. Seção "Sobre o Evento" */}
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-serif text-yellow-500 mb-4 sm:mb-6">Sobre o Evento</h2>
                                <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 sm:p-8">
                                    <p className="text-gray-300 text-sm sm:text-lg leading-relaxed mb-6">
                                        {event.description}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-yellow-500/10">
                                        {/* Capacidade */}
                                        <div className="flex items-center text-sm sm:text-base">
                                            <Users className="text-yellow-500 mr-3 h-5 w-5" />
                                            <div>
                                                <div className="text-xs text-gray-400">Capacidade</div>
                                                <span className="text-white font-semibold">{event.capacity.toLocaleString()} pessoas</span>
                                            </div>
                                        </div>
                                        {/* Duração */}
                                        <div className="flex items-center text-sm sm:text-base">
                                            <Clock className="text-yellow-500 mr-3 h-5 w-5" />
                                            <div>
                                                <div className="text-xs text-gray-400">Duração</div>
                                                <span className="text-white font-semibold">{event.duration}</span>
                                            </div>
                                        </div>
                                        {/* Classificação */}
                                        <div className="flex items-center text-sm sm:text-base">
                                            <UserCheck className="text-yellow-500 mr-3 h-5 w-5" />
                                            <div>
                                                <div className="text-xs text-gray-400">Classificação</div>
                                                <span className="text-white font-semibold">{classificationDisplay}</span>
                                            </div>
                                        </div>
                                        {/* Organizador */}
                                        <div className="flex items-center text-sm sm:text-base">
                                            <User className="text-yellow-500 mr-3 h-5 w-5" />
                                            <div>
                                                <div className="text-xs text-gray-400">Organizador</div>
                                                <span className="text-white font-semibold">{organizerName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* 3. Seção “Destaques do Evento” */}
                            {/* Usando destaques mockados, pois não temos a coluna 'highlights' no hook */}
                            <div>
                                <h3 className="text-xl sm:text-2xl font-serif text-yellow-500 mb-4 sm:mb-6">Destaques do Evento</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Mock de Destaques */}
                                    <Card className="bg-black/60 border border-yellow-500/30 rounded-2xl p-6 text-center hover:border-yellow-500/60 transition-all duration-300">
                                        <i className="fas fa-star text-3xl text-yellow-500 mb-3"></i>
                                        <p className="text-white font-semibold text-sm">Experiência Premium</p>
                                    </Card>
                                    <Card className="bg-black/60 border border-yellow-500/30 rounded-2xl p-6 text-center hover:border-yellow-500/60 transition-all duration-300">
                                        <i className="fas fa-trophy text-3xl text-yellow-500 mb-3"></i>
                                        <p className="text-white font-semibold text-sm">Curadoria Exclusiva</p>
                                    </Card>
                                    <Card className="bg-black/60 border border-yellow-500/30 rounded-2xl p-6 text-center hover:border-yellow-500/60 transition-all duration-300">
                                        <i className="fas fa-users text-3xl text-yellow-500 mb-3"></i>
                                        <p className="text-white font-semibold text-sm">Networking de Elite</p>
                                    </Card>
                                </div>
                            </div>
                            
                            {/* 4. Seção “Localização” */}
                            <div>
                                <h3 className="text-xl sm:text-2xl font-serif text-yellow-500 mb-4 sm:mb-6">Localização</h3>
                                <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 sm:p-8">
                                    <div className="flex items-start space-x-4 mb-6">
                                        <MapPin className="text-yellow-500 h-6 w-6 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-white font-semibold text-base sm:text-lg">{event.location}</h4>
                                            <p className="text-gray-300 text-sm sm:text-base">{event.address}</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded-xl h-48 sm:h-64 flex items-center justify-center">
                                        <div className="text-center">
                                            <i className="fas fa-map text-yellow-500 text-3xl sm:text-4xl mb-4"></i>
                                            <p className="text-gray-400 text-sm">Mapa interativo em breve</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Coluna de Ingressos (Sidebar) */}
                        <div id="ingressos" className="lg:col-span-1 order-1 lg:order-2">
                            <div className="lg:sticky lg:top-24">
                                <div className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 sm:p-8">
                                    <h3 className="text-xl sm:text-2xl font-serif text-yellow-500 mb-6">Selecionar Ingressos</h3>
                                    <div className="space-y-6">
                                        {ticketTypes.length > 0 ? (
                                            ticketTypes.map((ticket) => {
                                                const isAvailable = ticket.available > 0;
                                                const currentQuantity = selectedTickets[ticket.id] || 0;
                                                
                                                return (
                                                    <div key={ticket.id} className="bg-black/60 border border-yellow-500/20 rounded-xl p-4 sm:p-6 opacity-100 transition-opacity duration-300">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h4 className="text-white font-semibold text-base sm:text-lg">{ticket.name}</h4>
                                                                <p className="text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">{ticket.description}</p>
                                                            </div>
                                                            <div className="text-right flex-shrink-0 ml-4">
                                                                <div className="text-xl sm:text-2xl font-bold text-yellow-500">R$ {ticket.price.toFixed(0)}</div>
                                                                <div className="text-xs sm:text-sm text-gray-400">
                                                                    {isAvailable ? `${ticket.available} disponíveis` : 'Esgotado'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between pt-3 border-t border-yellow-500/10">
                                                            <span className="text-white text-sm sm:text-base">Quantidade:</span>
                                                            <div className="flex items-center space-x-3">
                                                                <button
                                                                    onClick={() => handleTicketChange(ticket.id, currentQuantity - 1)}
                                                                    className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-500/20 border border-yellow-500/40 rounded-full flex items-center justify-center text-yellow-500 hover:bg-yellow-500/30 transition-all duration-300 cursor-pointer disabled:opacity-30"
                                                                    disabled={!isAvailable || currentQuantity === 0 || isPurchasing}
                                                                >
                                                                    <i className="fas fa-minus text-xs"></i>
                                                                </button>
                                                                <span className="text-white font-semibold w-6 sm:w-8 text-center text-sm sm:text-base">
                                                                    {currentQuantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleTicketChange(ticket.id, currentQuantity + 1)}
                                                                    className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-500/20 border border-yellow-500/40 rounded-full flex items-center justify-center text-yellow-500 hover:bg-yellow-500/30 transition-all duration-300 cursor-pointer disabled:opacity-30"
                                                                    // CORREÇÃO: Se a quantidade atual é igual à disponibilidade, o botão deve ser desabilitado.
                                                                    disabled={!isAvailable || currentQuantity >= ticket.available || isPurchasing}
                                                                >
                                                                    <i className="fas fa-plus text-xs"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center p-4 bg-black/60 rounded-xl border border-red-500/30">
                                                <p className="text-red-400 text-sm">Nenhum tipo de ingresso ativo encontrado para este evento.</p>
                                            </div>
                                        )}
                                    </div>
                                    {getTotalTickets() > 0 && (
                                        <>
                                            <div className="border-t border-yellow-500/20 pt-6 mt-6">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-white text-base">Total de Ingressos:</span>
                                                    <span className="text-white font-semibold text-base">{getTotalTickets()}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-6">
                                                    <span className="text-white text-lg sm:text-xl">Total a Pagar:</span>
                                                    <span className="text-yellow-500 text-xl sm:text-2xl font-bold">R$ {getTotalPrice().toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={handleCheckout}
                                                disabled={isPurchasing}
                                                className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                {isPurchasing ? (
                                                    <div className="flex items-center justify-center">
                                                        <Loader2 className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
                                                        Redirecionando...
                                                    </div>
                                                ) : (
                                                    'Comprar e Pagar'
                                                )}
                                            </Button>
                                        </>
                                    )}
                                    {/* Aviso de Compra Segura */}
                                    <div className="mt-6 p-4 bg-black/40 rounded-xl border border-yellow-500/20 flex items-start space-x-3">
                                        <Shield className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-white font-semibold text-sm mb-1">Compra Segura</h4>
                                            <p className="text-gray-400 text-xs">
                                                Você será redirecionado ao Mercado Pago para finalizar o pagamento.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <footer className="bg-black border-t border-yellow-500/20 py-12 sm:py-16 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 sm:mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="text-xl sm:text-2xl font-serif text-yellow-500 font-bold mb-4">
                                Mazoy
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                A plataforma premium para eventos exclusivos e experiências inesquecíveis.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4 text-base sm:text-lg}>Links Úteis</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Sobre Nós</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Como Funciona</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Termos de Uso</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Privacidade</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4 text-base sm:text-lg}>Suporte</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Central de Ajuda</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Contato</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">FAQ</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Feedback</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4 text-base sm:text-lg}>Redes Sociais</h4>
                            <div className="flex space-x-4">
                                <a href="#" className="text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer">
                                    <i className="fab fa-instagram text-xl sm:text-2xl"></i>
                                </a>
                                <a href="#" className="text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer">
                                    <i className="fab fa-facebook text-xl sm:text-2xl"></i>
                                </a>
                                <a href="#" className="text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer">
                                    <i className="fab fa-twitter text-xl sm:text-2xl"></i>
                                </a>
                                <a href="#" className="text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer">
                                    <i className="fab fa-linkedin text-xl sm:text-2xl"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-yellow-500/20 pt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            © 2025 Mazoy. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default EventDetails;