"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import MultiLineEditor from '@/components/MultiLineEditor'; // Importando o MultiLineEditor diretamente
import { Loader2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast'; // Importando showSuccess

const ManagerRegister: React.FC = () => {
    const navigate = useNavigate();
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado para simular o envio

    const handleAgreeToTerms = (agreed: boolean) => {
        setAgreedToTerms(agreed);
    };

    const handleContinue = () => {
        setIsSubmitting(true);
        // Simular um processo de registro ou navegação
        setTimeout(() => {
            setIsSubmitting(false);
            showSuccess("Termos aceitos! Prossiga com o cadastro detalhado.");
            // Aqui você navegaria para a próxima etapa do cadastro de gestor
            // Por exemplo: navigate('/manager/register/details');
            navigate('/'); // Por enquanto, volta para a home
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 py-12">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, #fbbf24 0%, transparent 50%), radial-gradient(circle at 75% 75%, #fbbf24 0%, transparent 50%)',
                    backgroundSize: '400px 400px'
                }}></div>
            </div>
            <div className="relative z-10 w-full max-w-sm sm:max-w-md space-y-6">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">Cadastro de Gestor</h1>
                    <p className="text-gray-400 text-sm sm:text-base">Leia e aceite os termos para continuar</p>
                </div>
                
                {/* Renderiza o MultiLineEditor diretamente na página */}
                <MultiLineEditor 
                    onAgree={handleAgreeToTerms} 
                    initialAgreedState={agreedToTerms} 
                    showAgreementCheckbox={true} // Garante que o checkbox de concordância seja visível
                    termsType="manager_registration" // Especifica o tipo de termos
                />

                <div className="space-y-4">
                    <Button
                        onClick={handleContinue}
                        disabled={!agreedToTerms || isSubmitting}
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></Loader2>
                                <span>Carregando...</span>
                            </div>
                        ) : (
                            'Continuar'
                        )}
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="w-full bg-transparent border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer"
                    >
                        Voltar para a Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ManagerRegister;