"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const ManagerRegister: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 py-12">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, #fbbf24 0%, transparent 50%), radial-gradient(circle at 75% 75%, #fbbf24 0%, transparent 50%)',
                    backgroundSize: '400px 400px'
                }}></div>
            </div>
            <div className="relative z-10 w-full max-w-sm sm:max-w-md">
                <div className="text-center mb-6 sm:mb-8">
                    <div className="text-3xl font-serif text-yellow-500 font-bold mb-2">
                        Mazoy PRO
                    </div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">Cadastro de Gestor</h1>
                    <p className="text-gray-400 text-sm sm:text-base">Torne-se um promotor de eventos Mazoy!</p>
                </div>
                <div className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-yellow-500/10 text-center">
                    <p className="text-gray-300 mb-6">
                        Clique abaixo para iniciar seu cadastro como gestor e começar a criar eventos incríveis.
                    </p>
                    <Button
                        onClick={() => alert('Funcionalidade de novo cadastro de gestor em desenvolvimento!')}
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105"
                    >
                        Novo Cadastro
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="w-full mt-4 bg-transparent border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer"
                    >
                        Voltar para a Home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ManagerRegister;