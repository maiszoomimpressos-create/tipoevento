import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Lock, Calendar, User } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

interface CheckoutFormProps {
    totalPrice: number;
    onPaymentSuccess: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ totalPrice, onPaymentSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        cardHolder: '',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulação de validação e processamento
        if (totalPrice <= 0) {
            showError("O valor total deve ser maior que zero.");
            setIsLoading(false);
            return;
        }

        setTimeout(() => {
            setIsLoading(false);
            // Simulação de sucesso
            showSuccess("Pagamento processado com sucesso! Seus ingressos estão prontos.");
            onPaymentSuccess();
        }, 2000);
    };

    return (
        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10">
            <CardHeader>
                <CardTitle className="text-white text-xl sm:text-2xl font-semibold flex items-center">
                    <CreditCard className="h-6 w-6 mr-3 text-yellow-500" />
                    Informações de Pagamento
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePayment} className="space-y-6">
                    
                    {/* Nome no Cartão */}
                    <div>
                        <label htmlFor="cardHolder" className="block text-sm font-medium text-white mb-2 flex items-center">
                            <User className="h-4 w-4 mr-2 text-yellow-500" />
                            Nome no Cartão
                        </label>
                        <Input 
                            id="cardHolder" 
                            value={formData.cardHolder} 
                            onChange={handleInputChange} 
                            placeholder="Nome Completo"
                            className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                            required
                        />
                    </div>

                    {/* Número do Cartão */}
                    <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-white mb-2 flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-yellow-500" />
                            Número do Cartão
                        </label>
                        <Input 
                            id="cardNumber" 
                            value={formData.cardNumber} 
                            onChange={handleInputChange} 
                            placeholder="XXXX XXXX XXXX XXXX"
                            className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                            maxLength={19}
                            required
                        />
                    </div>

                    {/* Validade e CVV */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label htmlFor="expiryMonth" className="block text-sm font-medium text-white mb-2 flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
                                Validade (Mês/Ano)
                            </label>
                            <div className="flex space-x-2">
                                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, expiryMonth: value }))} required>
                                    <SelectTrigger className="w-full bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500">
                                        <SelectValue placeholder="Mês" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border-yellow-500/30 text-white">
                                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, expiryYear: value }))} required>
                                    <SelectTrigger className="w-full bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500">
                                        <SelectValue placeholder="Ano" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border-yellow-500/30 text-white">
                                        {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString().slice(-2)).map(y => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="cvv" className="block text-sm font-medium text-white mb-2 flex items-center">
                                <Lock className="h-4 w-4 mr-2 text-yellow-500" />
                                CVV
                            </label>
                            <Input 
                                id="cvv" 
                                type="text"
                                value={formData.cvv} 
                                onChange={handleInputChange} 
                                placeholder="123"
                                className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                maxLength={4}
                                required
                            />
                        </div>
                    </div>

                    {/* Botão de Pagamento */}
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 mt-8"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Processando Pagamento...
                            </div>
                        ) : (
                            `Pagar R$ ${totalPrice.toFixed(2).replace('.', ',')}`
                        )}
                    </Button>
                    
                    {/* Aviso de Segurança */}
                    <div className="text-center text-gray-400 text-xs mt-4 flex items-center justify-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Transação 100% segura e criptografada.
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default CheckoutForm;