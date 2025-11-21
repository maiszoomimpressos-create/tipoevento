import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { eventSlides, categories } from '@/data/events';
import AuthStatusMenu from '@/components/AuthStatusMenu';

const Index: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % eventSlides.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [eventSlides.length]);

    const handleEventClick = (event: any) => {
        navigate(`/events/${event.id}`);
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-yellow-500/20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="text-2xl font-serif text-yellow-500 font-bold">
                        EventsPremium
                    </div>
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#home" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Home</a>
                        <a href="#eventos" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Eventos</a>
                        <a href="#categorias" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Categorias</a>
                        <a href="#contato" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Contato</a>
                    </nav>
                    <div className="flex items-center space-x-3">
                        <AuthStatusMenu />
                        <Button
                            onClick={() => navigate('/manager/login')}
                            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 cursor-pointer px-4 flex items-center hidden md:flex"
                        >
                            <i className="fas fa-crown mr-2"></i>
                            Gestor PRO
                        </Button>
                    </div>
                </div>
            </header>
            <section id="home" className="pt-20 pb-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="relative h-[500px] overflow-hidden">
                        <div className="flex items-center justify-center h-full">
                            {eventSlides.map((slide, index) => {
                                let position = (index - currentSlide + eventSlides.length) % eventSlides.length;
                                if (position > eventSlides.length / 2) position -= eventSlides.length;
                                const getTransform = (pos: number) => {
                                    if (pos === 0) return 'translateX(-50%) scale(1)';
                                    if (pos === -1) return 'translateX(calc(-50% - 18rem)) scale(0.85)';
                                    if (pos === 1) return 'translateX(calc(-50% + 18rem)) scale(0.85)';
                                    if (pos === -2) return 'translateX(calc(-50% - 35rem)) scale(0.7)';
                                    if (pos === 2) return 'translateX(calc(-50% + 35rem)) scale(0.7)';
                                    if (pos === -3) return 'translateX(calc(-50% - 50rem)) scale(0.6)';
                                    if (pos === 3) return 'translateX(calc(-50% + 50rem)) scale(0.6)';
                                    return 'translateX(-50%) scale(0.5)';
                                };
                                const getOpacity = (pos: number) => {
                                    if (pos === 0) return 1;
                                    if (Math.abs(pos) === 1) return 0.9;
                                    if (Math.abs(pos) === 2) return 0.7;
                                    if (Math.abs(pos) === 3) return 0.5;
                                    return 0.3;
                                };
                                const getZIndex = (pos: number) => {
                                    return 50 - Math.abs(pos);
                                };
                                return (
                                    <div
                                        key={slide.id}
                                        className="absolute transition-all duration-1000 ease-in-out"
                                        style={{
                                            left: '50%',
                                            transform: getTransform(position),
                                            opacity: getOpacity(position),
                                            zIndex: getZIndex(position)
                                        }}
                                    >
                                        <div className="relative w-[750px] h-[450px] bg-black rounded-2xl overflow-hidden shadow-2xl shadow-yellow-500/20 cursor-pointer" onClick={() => handleEventClick(slide)}>
                                            <img
                                                src={slide.image}
                                                alt={slide.title}
                                                className="w-full h-full object-cover object-top"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="px-12 py-8 max-w-2xl">
                                                    <div className="inline-block bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold mb-3">
                                                        {slide.category}
                                                    </div>
                                                    <h2 className="text-4xl font-serif text-white mb-3 leading-tight">
                                                        {slide.title}
                                                    </h2>
                                                    <p className="text-lg text-gray-200 mb-4 font-light">
                                                        {slide.description}
                                                    </p>
                                                    <div className="flex items-center space-x-6 mb-6">
                                                        <div className="flex items-center text-yellow-500">
                                                            <i className="fas fa-calendar-alt mr-2"></i>
                                                            <span className="text-white">{slide.date}</span>
                                                        </div>
                                                        <div className="flex items-center text-yellow-500">
                                                            <i className="fas fa-map-marker-alt mr-2"></i>
                                                            <span className="text-white">{slide.location}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <span className="text-2xl font-bold text-yellow-500">
                                                            {slide.price}
                                                        </span>
                                                        <Button
                                                            className="bg-yellow-500 text-black hover:bg-yellow-600 px-6 py-3 font-semibold transition-all duration-300 cursor-pointer hover:scale-105"
                                                            onClick={() => handleEventClick(slide)}
                                                        >
                                                            Ver Evento
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentSlide((prev) => (prev - 1 + eventSlides.length) % eventSlides.length)}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 w-14 h-14 bg-black/80 border-2 border-yellow-500/60 rounded-full flex items-center justify-center text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500 hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg shadow-black/50"
                        >
                            <i className="fas fa-chevron-left text-lg"></i>
                        </button>
                        <button
                            onClick={() => setCurrentSlide((prev) => (prev + 1) % eventSlides.length)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 w-14 h-14 bg-black/80 border-2 border-yellow-500/60 rounded-full flex items-center justify-center text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500 hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg shadow-black/50"
                        >
                            <i className="fas fa-chevron-right text-lg"></i>
                        </button>
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex space-x-3 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-full border border-yellow-500/30">
                            {eventSlides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-4 h-4 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === index
                                            ? 'bg-yellow-500 scale-125 shadow-lg shadow-yellow-500/50'
                                            : 'bg-yellow-500/40 hover:bg-yellow-500/70 hover:scale-110'
                                        }`}
                                ></button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <section id="eventos" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-serif text-yellow-500 mb-4">Lista de Eventos</h2>
                        <div className="w-24 h-px bg-yellow-500 mx-auto"></div>
                    </div>
                    <div className="mb-12">
                        <div className="flex flex-col lg:flex-row gap-6 mb-8">
                            <div className="flex-1">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar eventos..."
                                        className="w-full bg-black/60 border border-yellow-500/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 text-lg focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                                    />
                                    <i className="fas fa-search absolute right-6 top-1/2 transform -translate-y-1/2 text-yellow-500 text-xl"></i>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <select className="bg-black/60 border border-yellow-500/30 rounded-xl px-6 py-4 text-white focus:border-yellow-500 focus:outline-none cursor-pointer">
                                    <option value="">Todas as Categorias</option>
                                    <option value="musica">Música</option>
                                    <option value="negocios">Negócios</option>
                                    <option value="arte">Arte</option>
                                    <option value="gastronomia">Gastronomia</option>
                                    <option value="tecnologia">Tecnologia</option>
                                </select>
                                <select className="bg-black/60 border border-yellow-500/30 rounded-xl px-6 py-4 text-white focus:border-yellow-500 focus:outline-none cursor-pointer">
                                    <option value="">Todas as Cidades</option>
                                    <option value="sao-paulo">São Paulo</option>
                                    <option value="rio-janeiro">Rio de Janeiro</option>
                                    <option value="belo-horizonte">Belo Horizonte</option>
                                    <option value="brasilia">Brasília</option>
                                </select>
                                <select className="bg-black/60 border border-yellow-500/30 rounded-xl px-6 py-4 text-white focus:border-yellow-500 focus:outline-none cursor-pointer">
                                    <option value="">Todas as Datas</option>
                                    <option value="hoje">Hoje</option>
                                    <option value="semana">Esta Semana</option>
                                    <option value="mes">Este Mês</option>
                                    <option value="proximo-mes">Próximo Mês</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="lg:w-80">
                                <div className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 sticky top-24">
                                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                                        <i className="fas fa-filter text-yellow-500 mr-3"></i>
                                        Filtros Avançados
                                    </h3>
                                    <div className="mb-6">
                                        <h4 className="text-white font-medium mb-3">Faixa de Preço</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" />
                                                <span className="text-gray-300">Gratuito</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" />
                                                <span className="text-gray-300">Até R$ 100</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" />
                                                <span className="text-gray-300">R$ 100 - R$ 300</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" />
                                                <span className="text-gray-300">Acima de R$ 300</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <h4 className="text-white font-medium mb-3">Horário</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" />
                                                <span className="text-gray-300">Manhã (06:00 - 12:00)</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" />
                                                <span className="text-gray-300">Tarde (12:00 - 18:00)</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" />
                                                <span className="text-gray-300">Noite (18:00 - 00:00)</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <h4 className="text-white font-medium mb-3">Status</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" defaultChecked />
                                                <span className="text-gray-300">Vendas Abertas</span>
                                            </label>
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" className="mr-3 accent-yellow-500" />
                                                <span className="text-gray-300">Últimos Ingressos</span>
                                            </label>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer">
                                        Aplicar Filtros
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {eventSlides.slice(0, 12).map((event) => (
                                        <Card
                                            key={event.id}
                                            className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl overflow-hidden hover:border-yellow-500/60 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 cursor-pointer hover:scale-105 group"
                                            onClick={() => handleEventClick(event)}
                                        >
                                            <div className="relative overflow-hidden">
                                                <img
                                                    src={event.image}
                                                    alt={event.title}
                                                    className="w-full h-56 object-cover object-top group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                                <div className="absolute top-4 left-4">
                                                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                                                        {event.category}
                                                    </span>
                                                </div>
                                                <div className="absolute top-4 right-4">
                                                    <button className="w-10 h-10 bg-black/60 border border-yellow-500/30 rounded-full flex items-center justify-center text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-300">
                                                        <i className="fas fa-heart"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-semibold text-white mb-3 line-clamp-2 group-hover:text-yellow-500 transition-colors duration-300">
                                                    {event.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                                    {event.description}
                                                </p>
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center text-gray-300 text-sm">
                                                        <i className="fas fa-calendar-alt text-yellow-500 mr-3 w-4"></i>
                                                        {event.date}
                                                    </div>
                                                    <div className="flex items-center text-gray-300 text-sm">
                                                        <i className="fas fa-map-marker-alt text-yellow-500 mr-3 w-4"></i>
                                                        {event.location}
                                                    </div>
                                                    <div className="flex items-center text-gray-300 text-sm">
                                                        <i className="fas fa-clock text-yellow-500 mr-3 w-4"></i>
                                                        {event.time || '20:00 - 23:00'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-yellow-500/20">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-400">A partir de</span>
                                                        <span className="text-2xl font-bold text-yellow-500">
                                                            {event.price}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        className="bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer px-6"
                                                    >
                                                        Ver Detalhes
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                <div className="flex items-center justify-center mt-12 space-x-2">
                                    <button className="w-12 h-12 bg-black/60 border border-yellow-500/30 rounded-xl flex items-center justify-center text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500 transition-all duration-300 cursor-pointer">
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    {[1, 2, 3, 4, 5].map((page) => (
                                        <button
                                            key={page}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 cursor-pointer ${page === 1
                                                    ? 'bg-yellow-500 text-black'
                                                    : 'bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button className="w-12 h-12 bg-black/60 border border-yellow-500/30 rounded-xl flex items-center justify-center text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500 transition-all duration-300 cursor-pointer">
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                                <div className="text-center mt-8">
                                    <p className="text-gray-400">
                                        Mostrando <span className="text-yellow-500 font-semibold">1-12</span> de <span className="text-yellow-500 font-semibold">127</span> eventos
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section id="categorias" className="py-20 px-6 bg-black/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-serif text-yellow-500 mb-4">Categorias</h2>
                        <div className="w-24 h-px bg-yellow-500 mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 text-center hover:border-yellow-500/60 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 cursor-pointer hover:scale-105"
                            >
                                <div className="text-4xl text-yellow-500 mb-4">
                                    <i className={category.icon}></i>
                                </div>
                                <h3 className="text-white font-semibold mb-2">{category.name}</h3>
                                <span className="text-gray-400 text-sm">{category.count} eventos</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-serif text-yellow-500 mb-6">Seja um Promotor</h2>
                    <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                        Transforme suas ideias em eventos extraordinários. Junte-se à nossa plataforma premium
                        e crie experiências inesquecíveis para seu público.
                    </p>
                    <Button
                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700 px-12 py-4 text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105"
                    >
                        Começar Agora
                    </Button>
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

export default Index;