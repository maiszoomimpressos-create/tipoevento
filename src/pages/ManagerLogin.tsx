import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const ManagerLogin: React.FC = () => {
    const navigate = useNavigate();
    const [managerLoginData, setManagerLoginData] = useState({ email: '', password: '' });

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, #fbbf24 0%, transparent 50%), radial-gradient(circle at 75% 75%, #fbbf24 0%, transparent 50%)',
                    backgroundSize: '400px 400px'
                }}></div>
            </div>
            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <div 
                        className="text-3xl font-serif text-yellow-500 font-bold mb-2 flex items-center justify-center cursor-pointer"
                        onClick={() => navigate('/')} // Adicionado onClick para navegar para a home
                    >
                        Mazoy
                        <span className="ml-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-lg text-sm font-bold">PRO</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-white mb-2">Área do Gestor</h1>
                    <p className="text-gray-400">Acesse seu painel de controle premium</p>
            
                                    id="managerPassword"
                                    value={managerLoginData.password}
                                    onChange={(e) => setManagerLoginData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full bg-black/60 border border-yellow-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-300"
                                    placeholder="Digite sua senha"
                                    required
                                />
                                <i className="fas fa-shield-alt absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-500/60 text-sm"></i>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="mr-2 accent-yellow-500" />
                                <span className="text-sm text-gray-300">Manter-me conectado</span>
                            </label>
                            <button type="button" className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors cursor-pointer">
                                Esqueci minha senha
                            </button>
                        </div>
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-600 hover:to-yellow-700 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105"
                            >
                                <i className="fas fa-crown mr-2"></i>
                                Acessar Dashboard PRO
                            </Button>
                            <Button
                </div>
            </div>
        </div>
    );
};

export default ManagerLogin;
