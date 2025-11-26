"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel, { EmblaCarouselType } from 'embla-carousel-react';
import { Card, CardContent } from "@/components/ui/card";
import { PublicEvent } from '@/hooks/use-public-events';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

interface EventCarouselProps {
    events: PublicEvent[];
}

const AUTOPLAY_DELAY = 6000; // 6 segundos

// Helper function to get the minimum price display
const getMinPriceDisplay = (price: number | null): string => {
    if (price === null) return 'Grátis';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

// Define a structure for each carousel slide in the new layout
interface CarouselSlideData {
    mainEvent: PublicEvent;
    leftSideEvents: PublicEvent[];
    rightSideEvents: PublicEvent[];
}

const EventCarousel = ({ events }: EventCarouselProps) => {
    const navigate = useNavigate();
    const isMobile = useIsMobile(); // Determine if on mobile
    
    // Limit to 20 events for the carousel
    const featuredEvents = events.slice(0, 20);

    // Helper to get events with wrap-around for side banners
    const getWrappedEvents = useCallback((allEvents: PublicEvent[], currentIndex: number, offset: number, count: number): PublicEvent[] => {
        const total = allEvents.length;
        const result: PublicEvent[] = [];
        if (total === 0) return [];

        for (let i = 1; i <= count; i++) {
            let index = (currentIndex + offset * i) % total;
            if (index < 0) index += total; // Handle negative indices for left side wrap-around
            result.push(allEvents[index]);
        }
        return result;
    }, []);

    // Generate carousel slides with main and side events
    const carouselSlides: CarouselSlideData[] = useMemo(() => {
        if (featuredEvents.length === 0) return [];

        return featuredEvents.map((mainEvent, index) => {
            const leftSideEvents = getWrappedEvents(featuredEvents, index, -1, 3);
            const rightSideEvents = getWrappedEvents(featuredEvents, index, 1, 3);
            return { mainEvent, leftSideEvents, rightSideEvents };
        });
    }, [featuredEvents, getWrappedEvents]);

    const [emblaRef, emblaApi] = useEmblaCarousel({ 
        loop: true,
        align: 'center', // Align center for the main banner
        slidesToScroll: 1,
        watchDrag: true,
    });
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

    // Auto-play logic
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

    // Navigation and indicator logic
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
            <div className="flex items-center justify-center h-full bg-black/60 border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/20">
                <div className="text-center p-8">
                    <i className="fas fa-star text-yellow-500 text-4xl mb-4"></i>
                    <h2 className="text-xl sm:text-2xl font-serif text-white mb-2">Destaques Premium</h2>
                    <p className="text-gray-400 text-sm">Nenhum evento em destaque encontrado.</p>
                </div>
            </div>
        );
    }

    // Mobile Layout
    if (isMobile) {
        return (
            <div className="relative">
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex touch-pan-y ml-[-1rem]">
                        {featuredEvents.map((event) => (
                            <div 
                                key={event.id} 
                                className="pl-4 basis-full flex-shrink-0 min-w-0"
                            >
                                <Card 
                                    className="bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-2xl overflow-hidden h-full cursor-pointer hover:border-yellow-500/60 transition-all duration-300 group"
                                    onClick={() => navigate(`/finalizar-compra`)} 
                                >
                                    <CardContent className="flex flex-col p-0">
                                        <div className="relative h-48 overflow-hidden">
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
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-center text-sm text-gray-300">
                                                <i className="fas fa-calendar-alt mr-2 text-yellow-500"></i>
                                                {event.date}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-300">
                                                <i className="fas fa-map-marker-alt mr-2 text-yellow-500"></i>
                                                {event.location}
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-lg font-bold text-yellow-500">
                                                    {getMinPriceDisplay(event.min_price)}
                                                </span>
                                                <Button 
                                                    variant="default" 
                                                    className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 text-xs"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/finalizar-compra`); }}
                                                >
                                                    Detalhes <ArrowRight className="h-3 w-3 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Navigation Arrows for Mobile */}
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

                {/* Indicators (Dots) for Mobile */}
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
    }

    // Desktop Layout
    return (
        <div className="relative">
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y">
                    {carouselSlides.map((slide, index) => (
                        <div key={slide.mainEvent.id + '-slide-' + index} className="flex-shrink-0 basis-full min-w-0 flex items-center justify-center">
                            <div className="relative w-full max-w-[1200px] h-[450px] flex items-center justify-center">
                                {/* Left side stack */}
                                <div className="absolute left-1/2 -translate-x-[calc(375px+100px+20px)] top-1/2 -translate-y-1/2 w-[200px] h-[400px] flex flex-col justify-center space-y-2 z-0">
                                    {slide.leftSideEvents.map((event, idx) => (
                                        <img 
                                            key={event.id + '-left-' + idx} 
                                            src={event.image_url} 
                                            alt={event.title} 
                                            className="w-full h-[120px] object-cover rounded-lg opacity-50 hover:opacity-75 transition-opacity cursor-pointer border border-yellow-500/20" 
                                            onClick={() => navigate(`/finalizar-compra`)}
                                        />
                                    ))}
                                </div>

                                {/* Central banner */}
                                <div className="w-[750px] h-[450px] relative z-10 rounded-2xl overflow-hidden shadow-lg border border-yellow-500/50">
                                    <img 
                                        src={slide.mainEvent.image_url} 
                                        alt={slide.mainEvent.title} 
                                        className="w-full h-full object-cover cursor-pointer" 
                                        onClick={() => navigate(`/finalizar-compra`)}
                                    />
                                    {/* Event details overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold mb-2 self-start">
                                            {slide.mainEvent.category}
                                        </span>
                                        <h3 className="text-xl font-serif text-white line-clamp-2">
                                            {slide.mainEvent.title}
                                        </h3>
                                        <div className="flex items-center text-sm text-gray-300 mt-2">
                                            <i className="fas fa-calendar-alt mr-2 text-yellow-500"></i>
                                            {slide.mainEvent.date}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-300">
                                            <i className="fas fa-map-marker-alt mr-2 text-yellow-500"></i>
                                            {slide.mainEvent.location}
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-bold text-yellow-500">
                                                {getMinPriceDisplay(slide.mainEvent.min_price)}
                                            </span>
                                            <Button 
                                                variant="default" 
                                                className="bg-yellow-500 text-black hover:bg-yellow-600 px-4 py-2 text-xs"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/finalizar-compra`); }}
                                            >
                                                Detalhes <ArrowRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right side stack */}
                                <div className="absolute right-1/2 translate-x-[calc(375px+100px+20px)] top-1/2 -translate-y-1/2 w-[200px] h-[400px] flex flex-col justify-center space-y-2 z-0">
                                    {slide.rightSideEvents.map((event, idx) => (
                                        <img 
                                            key={event.id + '-right-' + idx} 
                                            src={event.image_url} 
                                            alt={event.title} 
                                            className="w-full h-[120px] object-cover rounded-lg opacity-50 hover:opacity-75 transition-opacity cursor-pointer border border-yellow-500/20" 
                                            onClick={() => navigate(`/finalizar-compra`)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            
                {/* Navigation Arrows for Desktop */}
                <Button
                    variant="outline"
                    className="absolute left-1/2 -translate-x-[calc(375px+100px+20px+50px)] top-1/2 -translate-y-1/2 z-20 text-yellow-500 border-yellow-500 hover:bg-yellow-500/10 w-10 h-10 p-0 rounded-full hidden lg:flex"
                    onClick={scrollPrev}
                    disabled={prevBtnDisabled && carouselSlides.length > 1}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                    variant="outline"
                    className="absolute right-1/2 translate-x-[calc(375px+100px+20px+50px)] top-1/2 -translate-y-1/2 z-20 text-yellow-500 border-yellow-500 hover:bg-yellow-500/10 w-10 h-10 p-0 rounded-full hidden lg:flex"
                    onClick={scrollNext}
                    disabled={nextBtnDisabled && carouselSlides.length > 1}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>

                {/* Indicators (Dots) for Desktop */}
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
        </div>
    );
};

export default EventCarousel;