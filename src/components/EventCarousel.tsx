import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel, { EmblaCarouselType } from 'embla-carousel-react';
import { Card, CardContent } from "@/components/ui/card";
import { PublicEvent } from '@/hooks/use-public-events';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventCarouselProps {
    events: PublicEvent[];
}

const AUTOPLAY_DELAY = 6000; // 6 segundos

// Helper function to get the minimum price display
const getMinPriceDisplay = (price: number | null): string => {
    if (price === null) return 'Grátis'; // Se não houver ingressos ativos ou preço nulo
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

const EventCarousel = ({ events }: EventCarouselProps) => {
    const navigate = useNavigate();
    
    // Limita a 20 eventos
    const featuredEvents = events.slice(0, 20);

    const [emblaRef, emblaApi] = useEmblaCarousel({ 
        loop: true,
        align: 'center', // Centraliza o slide ativo
        slidesToScroll: 1,
        dragFree: false,
        containScroll: 'trimSnaps',
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

    const autoplay = useCallback(() => {
        if (!emblaApi) return;
        if (emblaApi.canScrollNext()) {
            emblaApi.scrollNext();
        } else {
            emblaApi.scrollTo(0);
        }
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        const timer = setInterval(autoplay, AUTOPLAY_DELAY);
        return () => { clearInterval(timer); };
    }, [emblaApi, autoplay]);

    const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setPrevBtnDisabled(!emblaApi.canScrollPrev());
        setNextBtnDisabled(!emblaApi.canScrollNext());
    }, []);

    const onInit = useCallback((emblaApi: EmblaCarouselType) => {
        setScrollSnaps(emblaApi.scrollSnapList());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;
        onInit(emblaApi);
        onSelect(emblaApi);
        emblaApi.on('reInit', onInit);
        emblaApi.on('select', onSelect);
    }, [emblaApi, onInit, onSelect]);

    const scrollTo = useCallback((index: number) => {
        emblaApi && emblaApi.scrollTo(index);
    }, [emblaApi]);
    
    const scrollPrev = useCallback(() => {
        emblaApi && emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        emblaApi && emblaApi.scrollNext();
    }, [emblaApi]);


    if (featuredEvents.length === 0) {
        return (
            <div className="w-[650px] h-[450px] mx-auto rounded-2xl flex items-center justify-center bg-black/60 border border-yellow-500/30 shadow-2xl shadow-yellow-500/20">
                <div className="text-center p-8">
                    <i className="fas fa-star text-yellow-500 text-4xl mb-4"></i>
                    <h2 className="text-xl sm:text-2xl font-serif text-white mb-2">Destaques Premium</h2>
                    <p className="text-gray-400 text-sm">Nenhum evento em destaque encontrado.</p>
                </div>
            </div>
        );
    }

    const CAROUSEL_WIDTH = 650; 
    const CAROUSEL_HEIGHT = 450; // Revertido para 450px
    const SLIDE_OFFSET_PERCENTAGE = 0.35; // 35% de deslocamento
    const SLIDE_OFFSET_PX = CAROUSEL_WIDTH * SLIDE_OFFSET_PERCENTAGE;

    return (
        <div className="relative w-[650px] h-[450px] mx-auto rounded-2xl overflow-hidden">
            <div className="embla__viewport h-full" ref={emblaRef}>
                <div className="embla__container relative h-full">
                    {featuredEvents.map((event, index) => {
                        const relativeIndex = index - selectedIndex;
                        
                        let opacity = 1;
                        let zIndex = 1;
                        let translateX = 0;

                        // Lógica para o efeito de escada com 7 banners visíveis
                        if (relativeIndex === 0) { // Item central
                            opacity = 1;
                            zIndex = 7;
                            translateX = 0;
                        } else if (relativeIndex === 1) { // Primeiro à direita
                            opacity = 0.8;
                            zIndex = 6;
                            translateX = SLIDE_OFFSET_PX;
                        } else if (relativeIndex === -1) { // Primeiro à esquerda
                            opacity = 0.8;
                            zIndex = 6;
                            translateX = -SLIDE_OFFSET_PX;
                        } else if (relativeIndex === 2) { // Segundo à direita
                            opacity = 0.6;
                            zIndex = 5;
                            translateX = SLIDE_OFFSET_PX * 2;
                        } else if (relativeIndex === -2) { // Segundo à esquerda
                            opacity = 0.6;
                            zIndex = 5;
                            translateX = -SLIDE_OFFSET_PX * 2;
                        } else if (relativeIndex === 3) { // Terceiro à direita
                            opacity = 0.4;
                            zIndex = 4;
                            translateX = SLIDE_OFFSET_PX * 3;
                        } else if (relativeIndex === -3) { // Terceiro à esquerda
                            opacity = 0.4;
                            zIndex = 4;
                            translateX = -SLIDE_OFFSET_PX * 3;
                        } else { // Itens fora do campo de 7 visíveis (escondidos)
                            opacity = 0; // Totalmente transparente
                            zIndex = 0;
                            // Empurra para fora da tela, considerando a largura total do carrossel
                            translateX = (relativeIndex > 0 ? 1 : -1) * (CAROUSEL_WIDTH / 2 + CAROUSEL_WIDTH); 
                        }

                        const transformStyle = `translateX(${translateX}px)`;

                        return (
                            <div 
                                key={event.id} 
                                className="embla__slide flex-shrink-0 relative"
                                style={{ 
                                    width: `${CAROUSEL_WIDTH}px`, // Todos os slides têm a largura total do carrossel
                                    height: `${CAROUSEL_HEIGHT}px`, // Todos os slides têm a altura total do carrossel
                                    transform: transformStyle,
                                    opacity: opacity,
                                    zIndex: zIndex,
                                    transition: 'transform 0.6s ease-out, opacity 0.6s ease-out',
                                    position: 'absolute', 
                                    top: 0,
                                    left: '50%', // Centraliza o ponto de origem para o translateX
                                    marginLeft: `-${CAROUSEL_WIDTH / 2}px`, // Ajusta para centralizar o slide em si
                                }}
                            >
                                <Card 
                                    className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl overflow-hidden h-full w-full cursor-pointer hover:border-yellow-500/60 transition-all duration-300 group"
                                    onClick={() => navigate(`/finalizar-compra`)} 
                                >
                                    <CardContent className="flex flex-col p-0 h-full">
                                        <div className="relative h-full overflow-hidden">
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                                                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold mb-2 self-start">
                                                    {event.category}
                                                </span>
                                                <h3 className="text-xl font-serif text-white line-clamp-2 group-hover:text-yellow-400 transition-colors">
                                                    {event.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Setas de Navegação Customizadas */}
            <Button
                variant="outline"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-yellow-500 border-yellow-500 hover:bg-yellow-500/10 w-10 h-10 p-0 rounded-full"
                onClick={scrollPrev}
                disabled={prevBtnDisabled && featuredEvents.length > 1}
            >
                <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
                variant="outline"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-yellow-500 border-yellow-500 hover:bg-yellow-500/10 w-10 h-10 p-0 rounded-full"
                onClick={scrollNext}
                disabled={nextBtnDisabled && featuredEvents.length > 1}
            >
                <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Indicadores (Bolinhas) */}
            <div className="absolute bottom-[-2rem] left-0 right-0 flex justify-center space-x-2 z-10">
                {scrollSnaps.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={cn(
                            "w-3 h-3 rounded-full transition-all duration-300",
                            index === selectedIndex ? "bg-yellow-500 w-6" : "bg-gray-500/50 hover:bg-yellow-500/50"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

export default EventCarousel;