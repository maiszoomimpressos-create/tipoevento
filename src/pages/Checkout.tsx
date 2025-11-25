import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

// Mock de dados de pedido (em um app real, isso viria do estado ou de props)
const mockOrder = {
    eventName: "Concerto Sinfônico Premium",
    totalTickets: 2,
    totalPrice: 560.00,
    items: [
        { name: "Plateia Premium", quantity: 2, price: 280.00 },
    ],
    paymentMethod: "Cartão de Crédito",
};

const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handlePayment = () => {
        setIsProcessing(true);
        
        // Simulação de processamento de pagamento
        setTimeout(() => {
            setIsProcessing(false);
            // Em um cenário real, aqui haveria a integração com o gateway de pagamento
            
            // Simulação de sucesso
            showSuccess("Pagamento processado com sucesso!");
            setIsConfirmed(true);
        }, 2000);
    };

    if (isConfirmed) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
                <Card className="w-full max-w-lg bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-2xl shadow-2xl shadow-green-500/10 p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6 animate-fadeInUp" />
                    <CardTitle className="text-white text-3xl font-serif mb-4">Compra Concluída!</CardTitle>
                    <CardDescription className="text-gray-400 text-lg mb-6">
                        Seus ingressos foram enviados para o seu e-mail e estão disponíveis na seção "Meus Ingressos".
                    </CardDescription>
                    <div className="space-y-4">
                        <Button
                            onClick={() => navigate('/tickets')}
                            className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold"
                        >
                            Ver Meus Ingressos
                        </Button>
                        <Button
                            onClick={() => navigate('/')}
                            variant="outline"
                            className="w-full bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold"
                        >
                            Voltar para a Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl sm:text-4xl font-serif text-yellow-500 flex items-center">
                        <ShoppingCart className="h-8 w-8 mr-3" />
                        Finalizar Compra
                    </h1>
                    <Button 
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna de Detalhes do Pedido */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                            <CardHeader className="p-0 mb-4 border-b border-yellow-500/20 pb-4">
                                <CardTitle className="text-white text-xl font-semibold">Resumo do Pedido</CardTitle>
                                <CardDescription className="text-gray-400 text-sm">{mockOrder.eventName}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 space-y-4">
                                {mockOrder.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm sm:text-base">
                                        <span className="text-gray-300">{item.name} ({item.quantity}x)</span>
                                        <span className="text-white font-medium">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                ))}
                                <div className="border-t border-yellow-500/20 pt-4 flex justify-between items-center">
                                    <span className="text-white text-lg sm:text-xl font-semibold">Total a Pagar:</span>
                                    <span className="text-yellow-500 text-xl sm:text-2xl font-bold">R$ {mockOrder.totalPrice.toFixed(2).replace('.', ',')}</span>
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Informações do Comprador (Mock) */}
                        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                            <CardHeader className="p-0 mb-4 border-b border-yellow-500/20 pb-4">
                                <CardTitle className="text-white text-xl font-semibold">Dados do Comprador</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-3 text-sm text-gray-300">
                                <p>Nome: [Nome do Usuário Logado]</p>
                                <p>E-mail: [Email do Usuário Logado]</p>
                                <p>CPF: [CPF do Usuário Logado]</p>
                                <p className="text-yellow-500 pt-2">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    Certifique-se de que seu perfil está completo para a emissão correta do ingresso.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna de Pagamento */}
                    <div className="lg:col-span-1">
                        <Card className="lg:sticky lg:top-24 bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 space-y-6">
                            <CardTitle className="text-white text-xl font-semibold flex items-center">
                                <CreditCard className="h-5 w-5 mr-2 text-yellow-500" />
                                Método de Pagamento
                            </CardTitle>
                            
                            {/* Mock de Formulário de Pagamento */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Número do Cartão</label>
                                    <Input placeholder="**** **** **** 4242" disabled className="bg-black/60 border-yellow-500/30 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Nome no Cartão</label>
                                    <Input placeholder="Nome Completo" disabled className="bg-black/60 border-yellow-500/30 text-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">Validade</label>
                                        <Input placeholder="MM/AA" disabled className="bg-black/60 border-yellow-500/30 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">CVV</label>
                                        <Input placeholder="***" disabled className="bg-black/60 border-yellow-500/30 text-white" />
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Processando Pagamento...
                                    </div>
                                ) : (
                                    `Pagar R$ ${mockOrder.totalPrice.toFixed(2).replace('.', ',')}`
                                )}
                            </Button>
                            
                            <div className="text-center text-xs text-gray-500">
                                Ao clicar em Pagar, você concorda com os Termos de Serviço.
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;