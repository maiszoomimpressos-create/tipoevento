import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { purchasedTickets } from '@/data/tickets';
import AuthStatusMenu from '@/components/AuthStatusMenu';
import { Input } from '@/components/ui/input';

interface TicketCardProps {
    ticket: typeof purchasedTickets[0];
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
    const navigate = useNavigate();
    
    const statusClasses = {
        active: 'bg-green-500/20 text-green-400 border-green-500/30',
        used: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const statusText = {
        active: 'Ativo',
        used: 'Utilizado',
        cancelled: 'Cancelado',
    };

    return (
        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 hover:border-yellow-500/60 transition-all duration-300">
            <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center space-x-3">
                    <CardTitle className="text-white text-lg sm:text-xl font-semibold hover:text-yellow-500 transition-colors cursor-pointer" onClick={() => navigate(`/events/${ticket.eventId}`)}>
                        {ticket.eventName}
                    </CardTitle>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusClasses[ticket.status]}`}>
                        {statusText[ticket.status]}
                    </span>
                </div>
                <p className="text-gray-400 text-sm">{ticket.ticketType} ({ticket.quantity}x)</p>
                <div className="flex flex-wrap items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-300 pt-2">
                    <div className="flex items-center">
                        <i className="fas fa-calendar-alt text-yellow-500 mr-2"></i>
                        <span>{ticket.date}</span>
                    </div>
                    <div className="flex items-center">
                        <i className="fas fa-map-marker-alt text-yellow-500 mr-2"></i>
                        <span>{ticket.location}</span>
                    </div>
                </div>
            </div>
            
            <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between pt-4 md:pt-0 border-t border-yellow-500/20 md:border-t-0">
                <div className="text-left md:text-right">
                    <span className="text-xs sm:text-sm text-gray-400">Valor Total</span>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-500">R$ {(ticket.price * ticket.quantity).toLocaleString('pt-BR')}</div>
                </div>
                <Button 
                    className="bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer px-4 sm:px-6 text-sm sm:text-base"
                    onClick={() => alert(`Exibindo QR Code para o ingresso ${ticket.id}`)}
                    disabled={ticket.status !== 'active'}
                >
                    <i className="fas fa-qrcode mr-2"></i>
                    {ticket.status === 'active' ? 'Ver QR Code' : 'Ingresso Inativo'}
                </Button>
            </div>
        </Card>
    );
};

const MyTickets: React.FC = () => {
    const navigate = useNavigate();
    const activeTickets = purchasedTickets.filter(t => t.status === 'active');
    const pastTickets = purchasedTickets.filter(t => t.status !== 'active');

    return (
        <div className="min-h-screen bg-black text-white">
             <header className="fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-md border-b border-yellow-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 sm:space-x-8">
                        <Link to="/" className="text-xl sm:text-2xl font-serif text-yellow-500 font-bold cursor-pointer">
                            Mazoy
                        </Link>
                        <nav className="hidden md:flex items-center space-x-8">
                            <button onClick={() => navigate('/')} className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Home</button>
                            <a href="/#eventos" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Eventos</a>
                            <a href="/#categorias" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Categorias</a>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative hidden lg:block">
                            <Input 
                                type="search" 
                                placeholder="Buscar eventos..." 
                                className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 w-64 pl-4 pr-10 py-2 rounded-xl"
                            />
                            <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-500/60"></i>
                        </div>
                        <AuthStatusMenu />
                    </div>
                </div>
            </header>
            <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                    <h1 className="text-3xl sm:text-4xl font-serif text-yellow-500 mb-4 sm:mb-0">Meus Ingressos</h1>
                    <Button 
                        onClick={() => navigate('/profile')}
                        variant="outline"
                        className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm sm:text-base"
                    >
                        <i className="fas fa-user-circle mr-2"></i>
                        Voltar ao Perfil
                    </Button>
                </div>

                <div className="space-y-10 sm:space-y-12">
                    {/* Ingressos Ativos */}
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif text-white mb-6 border-b border-yellow-500/30 pb-3 flex items-center">
                            <i className="fas fa-ticket-alt mr-3 text-yellow-500"></i>
                            Ingressos Ativos ({activeTickets.length})
                        </h2>
                        {activeTickets.length > 0 ? (
                            <div className="space-y-6">
                                {activeTickets.map(ticket => (
                                    <TicketCard key={ticket.id} ticket={ticket} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 sm:p-12 bg-black/60 border border-yellow-500/30 rounded-2xl">
                                <i className="fas fa-calendar-plus text-5xl sm:text-6xl text-gray-600 mb-4"></i>
                                <p className="text-gray-400 text-base sm:text-lg">Você não possui ingressos ativos no momento.</p>
                                <Button 
                                    onClick={() => navigate('/')}
                                    className="mt-6 bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer"
                                >
                                    Explorar Eventos
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Histórico de Ingressos */}
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-serif text-white mb-6 border-b border-yellow-500/30 pb-3 flex items-center">
                            <i className="fas fa-history mr-3 text-yellow-500"></i>
                            Histórico de Ingressos ({pastTickets.length})
                        </h2>
                        {pastTickets.length > 0 ? (
                            <div className="space-y-6">
                                {pastTickets.map(ticket => (
                                    <TicketCard key={ticket.id} ticket={ticket} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 p-4 text-base">Nenhum ingresso no histórico.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MyTickets;