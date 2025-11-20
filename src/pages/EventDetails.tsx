import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { eventSlides } from '@/data/events';
import AuthStatusMenu from '@/components/AuthStatusMenu';

const EventDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const selectedEvent = eventSlides.find(event => event.id.toString() === id);
    const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});

    const handleTicketChange = (ticketId: string, quantity: number) => {
        setSelectedTickets(prev => ({
            ...prev,
            [ticketId]: Math.max(0, quantity)
        }));
    };

    const getTotalPrice = () => {
        if (!selectedEvent) return 0;
        return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
            const ticket = selectedEvent.ticketTypes.find((t: any) => t.id.toString() === ticketId);
            return total + (ticket ? ticket.price * quantity : 0);
        }, 0);
    };

    const getTotalTickets = () => {
        return Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0);
    };

    if ( !selectedEvent) {
        return <div>Event not found</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-yellow-500/20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="text-2xl font-serif text-yellow-500 font-bold">
                        EventsPremium
                    </div>
                    <nav className="hidden md:flex items-center space-x-8">
                        <button onClick={() => navigate('/')} className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Home</button>
                        <a href="/#eventos" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Eventos</a>
                        <a href="/#categorias" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Categorias</a>
                        <a href="/#contato" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Contato</a>
                    </nav>
                    <div className="flex items-center space-x-3">
                        <AuthStatusMenu />
                        <Button onClick={() => navigate('/')} className="border border-yellow-500 bg-transparent text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-300 cursor-pointer">
                            Voltar
                        </Button>
                    </div>
                </div>
            </header>
            <section className="pt-20 pb-0">
                <div className="relative h-[600px] overflow-hidden">
                    <img
                        src={selectedEvent.image}
                        alt={selectedEvent.title}
                        className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40"></div>
                    <div className="absolute inset-0 flex items-center">
                        <div className="max-w-7xl mx-auto px-6 w-full">
                            <div className="max-w-3xl">
                                <div className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold mb-4">
                                    {selectedEvent.category}
                                </div>
                                <h1 className="text-6xl font-serif text-white mb-6 leading-tight">
                                    {selectedEvent.title}
                                </h1>
                                <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                                    {selectedEvent.description}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="flex items-center">
                                        <i className="fas fa-calendar-alt text-yellow-500 text-2xl mr-4"></i>
                                        <div>
                                            <div className="text-sm text-gray-400">Data</div>
                                            <div className="text-lg font-semibold text-white">{selectedEvent.date}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <i className="fas fa-clock text-yellow-500 text-2xl mr-4"></i>
                                        <div>
                                            <div className="text-sm text-gray-400">Horário</div>
                                            <div className="text-lg font-semibold text-white">{selectedEvent.time}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <i className="fas fa-map-marker-alt text-yellow-500 text-2xl mr-4"></i>
                                        <div>
                                            <div className="text-sm text-gray-400">Local</div>
                                            <div className="text-lg font-semibold text-white">{selectedEvent.location}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <span className="text-4xl font-bold text-yellow-500">
                                        A partir de {selectedEvent.price}
                                    </span>
                                    <Button className="bg-yellow-500 text-black hover:bg-yellow-600 px-8 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105">
                                        Comprar Ingressos
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="w-full h-px bg-yellow-500"></div>
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-12">
                            <div>
                                <h2 className="text-3xl font-serif text-yellow-500 mb-6">Sobre o Evento</h2>
                                <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8">
                                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                                        {selectedEvent.description}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <i className="fas fa-users text-yellow-500 mr-3"></i>
                                                <span className="text-white">Capacidade: {selectedEvent.capacity} pessoas</span>
                                            </div>
                                            <div className="flex items-center">
                                                <i className="fas fa-clock text-yellow-500 mr-3"></i>
                                                <span className="text-white">Duração: {selectedEvent.duration}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <i className="fas fa-user-check text-yellow-500 mr-3"></i>
                                                <span className="text-white">Classificação: {selectedEvent.ageRating}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <i className="fas fa-user-tie text-yellow-500 mr-3"></i>
                                                <span className="text-white">Organizador: {selectedEvent.organizer}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif text-yellow-500 mb-6">Destaques do Evento</h3>
                                <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {selectedEvent.highlights.map((highlight: string, index: number) => (
                                            <div key={index} className="flex items-center">
                                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-4"></div>
                                                <span className="text-white">{highlight}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif text-yellow-500 mb-6">Localização</h3>
                                <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8">
                                    <div className="flex items-start space-x-4 mb-6">
                                        <i className="fas fa-map-marker-alt text-yellow-500 text-xl mt-1"></i>
                                        <div>
                                            <h4 className="text-white font-semibold text-lg mb-2">{selectedEvent.location}</h4>
                                            <p className="text-gray-300">{selectedEvent.address}</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded-xl h-64 flex items-center justify-center">
                                        <div className="text-center">
                                            <i className="fas fa-map text-yellow-500 text-4xl mb-4"></i>
                                            <p className="text-gray-400">Mapa interativo em breve</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <div className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8">
                                    <h3 className="text-2xl font-serif text-yellow-500 mb-6">Selecionar Ingressos</h3>
                                    <div className="space-y-6">
                                        {selectedEvent.ticketTypes.map((ticket: any) => (
                                            <div key={ticket.id} className="bg-black/60 border border-yellow-500/20 rounded-xl p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-white font-semibold text-lg">{ticket.name}</h4>
                                                        <p className="text-gray-400 text-sm mt-1">{ticket.description}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-yellow-500">R$ {ticket.price}</div>
                                                        <div className="text-sm text-gray-400">{ticket.available} disponíveis</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white">Quantidade:</span>
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            onClick={() => handleTicketChange(ticket.id.toString(), (selectedTickets[ticket.id.toString()] || 0) - 1)}
                                                            className="w-8 h-8 bg-yellow-500/20 border border-yellow-500/40 rounded-full flex items-center justify-center text-yellow-500 hover:bg-yellow-500/30 transition-all duration-300 cursor-pointer"
                                                        >
                                                            <i className="fas fa-minus text-xs"></i>
                                                        </button>
                                                        <span className="text-white font-semibold w-8 text-center">
                                                            {selectedTickets[ticket.id.toString()] || 0}
                                                        </span>
                                                        <button
                                                            onClick={() => handleTicketChange(ticket.id.toString(), (selectedTickets[ticket.id.toString()] || 0) + 1)}
                                                            className="w-8 h-8 bg-yellow-500/20 border border-yellow-500/40 rounded-full flex items-center justify-center text-yellow-500 hover:bg-yellow-500/30 transition-all duration-300 cursor-pointer"
                                                        >
                                                            <i className="fas fa-plus text-xs"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {getTotalTickets() > 0 && (
                                        <>
                                            <div className="border-t border-yellow-500/20 pt-6 mt-6">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-white">Total de Ingressos:</span>
                                                    <span className="text-white font-semibold">{getTotalTickets()}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-6">
                                                    <span className="text-white text-lg">Total a Pagar:</span>
                                                    <span className="text-yellow-500 text-2xl font-bold">R$ {getTotalPrice()}</span>
                                                </div>
                                            </div>
                                            <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-4 text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105">
                                                Finalizar Compra
                                            </Button>
                                        </>
                                    )}
                                    <div className="mt-6 p-4 bg-black/40 rounded-xl">
                                        <div className="flex items-center text-yellow-500 mb-2">
                                            <i className="fas fa-shield-alt mr-2"></i>
                                            <span className="text-sm font-semibold">Compra Segura</span>
                                        </div>
                                        <p className="text-gray-400 text-xs">
                                            Seus dados estão protegidos e a compra é 100% segura.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="w-full h-px bg-yellow-500"></div>
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-serif text-yellow-500 mb-4">Eventos Relacionados</h2>
                        <div className="w-24 h-px bg-yellow-500 mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {eventSlides
                            .filter(event => event.category === selectedEvent.category && event.id !== selectedEvent.id)
                            .slice(0, 4)
                            .map((event) => (
                                <Card
                                    key={event.id}
                                    className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl overflow-hidden hover:border-yellow-500/60 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 cursor-pointer hover:scale-105 group"
                                    onClick={() => navigate(`/events/${event.id}`)}
                                >
                                    <div className="relative overflow-hidden">
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-full h-48 object-cover object-top group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                                                {event.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-yellow-500 transition-colors duration-300">
                                            {event.title}
                                        </h3>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-gray-300 text-sm">
                                                <i className="fas fa-calendar-alt text-yellow-500 mr-3 w-4"></i>
                                                {event.date}
                                            </div>
                                            <div className="flex items-center text-gray-300 text-sm">
                                                <i className="fas fa-map-marker-alt text-yellow-500 mr-3 w-4"></i>
                                                {event.location}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-yellow-500/20">
                                            <span className="text-xl font-bold text-yellow-500">
                                                {event.price}
                                            </span>
                                            <Button
                                                className="bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer px-4 text-sm"
                                            >
                                                Ver Evento
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                    </div>
                </div>
            </section>
            <footer className="bg-black border-t border-yellow-500/20 py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <div className="text-2xl font-serif text-yellow-500 font-bold mb-4">
                                EventsPremium
                            </div>
                            <p className="text-gray-400 leading-relaxed">
                                A plataforma premium para eventos exclusivos e experiências inesquecíveis.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Links Úteis</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Sobre Nós</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Como Funciona</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Termos de Uso</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Privacidade</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Suporte</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Central de Ajuda</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Contato</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">FAQ</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer">Feedback</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Redes Sociais</h4>
                            <div className="flex space-x-4">
                                <a href="#" className="text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer">
                                    <i className="fab fa-instagram text-2xl"></i>
                                </a>
                                <a href="#" className="text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer">
                                    <i className="fab fa-facebook text-2xl"></i>
                                </a>
                                <a href="#" className="text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer">
                                    <i className="fab fa-twitter text-2xl"></i>
                                </a>
                                <a href="#" className="text-yellow-500 hover:text-yellow-600 transition-colors cursor-pointer">
                                    <i className="fab fa-linkedin text-2xl"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-yellow-500/20 pt-8 text-center">
                        <p className="text-gray-400">
                            © 2025 EventsPremium. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default EventDetails;