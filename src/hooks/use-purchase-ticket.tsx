import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface PurchaseItem {
    ticketTypeId: string; // ID da pulseira base (wristband ID)
    quantity: number;
    price: number; // Valor unitário
    name: string; // Nome do item para o Mercado Pago
}

interface PurchaseDetails {
    eventId: string; // UUID do evento
    purchaseItems: PurchaseItem[];
}

interface PurchaseResponse {
    checkoutUrl: string;
    transactionId: string;
}

export const usePurchaseTicket = () => {
    const [isLoading, setIsLoading] = useState(false);

    const purchaseTicket = async (details: PurchaseDetails): Promise<PurchaseResponse | false> => {
        const { eventId, purchaseItems } = details;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showError("Você precisa estar logado para finalizar a compra.");
            return false;
        }
        
        const totalTickets = purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
        if (totalTickets <= 0) {
            showError("A quantidade de ingressos deve ser maior que zero.");
            return false;
        }

        setIsLoading(true);

        try {
            // 1. Chamar a Edge Function para criar a preferência de pagamento
            const { data: responseData, error: edgeError } = await supabase.functions.invoke('create-payment-preference', {
                body: {
                    eventId: eventId,
                    purchaseItems: purchaseItems,
                },
            });

            if (edgeError) {
                throw new Error(edgeError.message);
            }
            
            if (responseData.error) {
                throw new Error(responseData.error);
            }
            
            // 2. Sucesso: Retorna o URL de checkout e o ID da transação
            return {
                checkoutUrl: responseData.checkoutUrl,
                transactionId: responseData.transactionId,
            };

        } catch (error: any) {
            console.error("Transaction Error:", error);
            showError(error.message || "Falha ao iniciar a transação de compra. Tente novamente.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        purchaseTicket,
    };
};