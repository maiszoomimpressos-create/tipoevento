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
            {/* Conteúdo removido conforme solicitado */}
        </div>
    );
};

export default ManagerRegister;