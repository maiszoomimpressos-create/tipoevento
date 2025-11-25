import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const HeroSection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section id="home" className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden bg-black">
            {/* Imagem de fundo dramática (Placeholder) */}
            <div 
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: 'url(https://readdy.ai/api/search-image?query=luxury%20black%20and%20gold%20event%20venue%20with%20elegant%20lighting%20and%20premium%20atmosphere%2C%20sophisticated%20interior%20design%20with%20golden%20accents%20and%20dramatic%20shadows&width=1600&height=900&seq=hero&orientation=landscape)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            ></div>
            
            {/* Gradiente para garantir legibilidade do texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

            <div className="relative z-10 max-w-7xl mx-auto h-full flex flex-col justify-center items-center text-center px-4 sm:px-6">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-yellow-500 font-bold mb-4 sm:mb-6 animate-fadeInUp">
                    Mazoy
                </h1>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 leading-tight animate-fadeInUp delay-100">
                    Experiências Premium. Ingressos Exclusivos.
                </h2>
                <p className="text-base sm:text-xl text-gray-300 max-w-3xl mb-8 sm:mb-10 animate-fadeInUp delay-200">
                    Descubra os eventos mais sofisticados, de concertos sinfônicos a jantares Michelin. Seu acesso ao extraordinário começa aqui.
                </p>
                
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 animate-fadeInUp delay-300">
                    <Button
                        onClick={() => {
                            // Rola para a seção de eventos
                            document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-yellow-500 text-black hover:bg-yellow-600 px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg shadow-yellow-500/30"
                    >
                        <Search className="mr-2 h-5 w-5" />
                        Explorar Eventos
                    </Button>
                    <Button
                        onClick={() => navigate('/manager/login')}
                        variant="outline"
                        className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer"
                    >
                        Área do Gestor PRO
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;