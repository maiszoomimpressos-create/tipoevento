import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel, { EmblaCarouselType } from 'embla-carousel-react';
import {
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"; // Reutilizando componentes de navegação
import { Card, CardContent } from "@/components/ui/card";
import { PublicEvent } from '@/hooks/use-public-events';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventCarouselProps {
    events: PublicEvent[];
}

const AUTOPLAY_DELAY = 6000; // 6 segundos

const EventCarousel: React.FC<EventCarouselProps> = ({ events }) => {
    const navigate = useNavigate();
    
    // Limita a 20 eventos, conforme solicitado
    const featuredEvents = events.slice(0, 20);

    const [emblaRef, emblaApi] = useEmblaCarousel({ 
        loop: true,
        align: 'start',
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    // --- Lógica de Auto-Play ---
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

        return () => {
            clearInterval(timer);
        };
    }, [emblaApi, autoplay]);

    // --- Lógica de Navegação e Indicadores ---
    const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
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

    if (featuredEvents.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-black/60 border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/20">
                <div className="text-center p-8">
                    <i className="fas fa-star text-yellow-500 text-4xl mb-4"></i>
                    <h2 className="text-xl sm:text-2xl font-serif text-white mb-2">Destaques Premium</h2>
                    <p className="text-gray-400 text-sm">Nenhum evento em destaque encontrado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
                <CarouselContent className="flex touch-pan-y ml-0">
                    {featuredEvents.map((event, index) => (
                        <CarouselItem key={event.id} className="pl-0 basis-full">
                            <div className="p-1">
                                <Card 
                                    className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl overflow-hidden h-full cursor-pointer hover:border-yellow-500/60 transition-all duration-300 group"
                                    onClick={() => navigate(`/events/${event.id}`)}
                                >
                                    <CardContent className="flex flex-col aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1] p-0">
                                        <div className="relative h-full">
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full h-full object-cover object-center"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent p-6 flex flex-col justify-center">
                                                <div className="max-w-full lg:max-w-xl">
                                                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold mb-2 self-start">
                                                        {event.category}
                                                    </span>
                                                    <h3 className="text-2xl sm:text-4xl font-serif text-white mb-3 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                                                        {event.title}
                                                    </h3>
                                                    <div className="flex items-center space-x-4 text-sm sm:text-base text-gray-300">
                                                        <div className="flex items-center">
                                                            <i className="fas fa-calendar-alt mr-2 text-yellow-500"></i>
                                                            {event.date}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <i className="fas fa-map-marker-alt mr-2 text-yellow-500"></i>
                                                            {event.location}
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="default" 
                                                        className="mt-4 bg-yellow-500 text-black hover:bg-yellow-600 px-6 py-2 text-sm sm:text-base"
                                                    >
                                                        Ver Detalhes <ArrowRight className="h-4 w-4 ml-2" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </div>
            
            {/* Setas de Navegação */}
            <CarouselPrevious 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-yellow-500 border-yellow-500 hover:bg-yellow-500/10" 
                onClick={() => emblaApi?.scrollPrev()}
            />
            <CarouselNext 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-yellow-500 border-yellow-500 hover:bg-yellow-500/10" 
                onClick={() => emblaApi?.scrollNext()}
            />

            {/* Indicadores (Bolinhas) */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
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