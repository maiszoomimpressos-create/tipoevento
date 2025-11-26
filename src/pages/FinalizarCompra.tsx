import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEventDetails } from '@/hooks/use-event-details';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { showError } from '@/utils/toast';
import EventBanner from '@/components/EventBanner'; // Importando o novo componente

// Helper function to get the minimum price display
const getMinPriceDisplay = (price: number | null): string => {
    if (price === null || price === 0) return 'Grátis';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
};

const FinalizarCompra: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // 1. Obter o ID do evento do estado de navegação
    const eventId = location.state?.eventId as string | undefined;

    // 2. Buscar os detalhes do evento
    const { details, isLoading, isError } = useEventDetails(eventId);

    if (!eventId) {
        // Se não houver ID, redireciona para a home
        React.useEffect(() => {
            showError("Nenhum evento selecionado para a compra.");
            navigate('/', { replace: true });
        }, [navigate]);
        
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (isError || !details) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center pt-20 px-4">
                <h1 className="text-4xl font-serif text-red-500 mb-4">Erro</h1>
                <p className="text-xl text-gray-400 mb-6">Não foi possível carregar os detalhes do evento.</p>
                <Button onClick={() => navigate('/')} className="bg-yellow-500 text-black hover:bg-yellow-600">
                    Voltar para a Home
                </Button>
            </div>
        );
    }
    
    const { event } = details;
    const minPriceDisplay = getMinPriceDisplay(event.min_price);

    return (
        <div className="bg-black text-white">
            {/* Componente de Banner no Topo (sem botão de ação) */}
            <EventBanner event={event} minPriceDisplay={minPriceDisplay} showActionButton={false} />
            
            {/* Conteúdo principal da finalização de compra */}
            <main className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
                <h2 className="text-3xl font-serif text-white mb-8">Finalizar Compra</h2>
                <p className="text-gray-400">Conteúdo do checkout será implementado aqui.</p>
            </main>
        </div>
    );
};

export default FinalizarCompra;