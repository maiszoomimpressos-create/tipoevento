import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({ email: '', password: '' });

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
                    <div className="text-3xl font-serif text-yellow-500 font-bold mb-2">
                        EventsPremium
                    </div>
                    <h1 className="text-2xl font-semibold text-white mb-2">Acessar Conta</h1>
                    <p className="text-gray-400">Bem-vindo de volta!</p>
                </div>
                <div className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8 shadow-2xl shadow-yellow-500/10">
                    <form onSubmit={(e) => { e.preventDefault(); navigate('/'); }} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                                E-mail
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    id="email"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full bg-black/60 border border-yellow-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-300"
                                    placeholder="seu@email.com"
                                    required
                                />
                                <i className="fas fa-envelope absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-500/60 text-sm"></i>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    id="password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full bg-black/60 border border-yellow-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-300"
                                    placeholder="Digite sua senha"
                                    required
                                />
                                <i className="fas fa-lock absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-500/60 text-sm"></i>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="mr-2 accent-yellow-500" />
                                <span className="text-sm text-gray-300">Lembrar-me</span>
                            </label>
                            <button type="button" className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors cursor-pointer">
                                Esqueci a senha
                            </button>
                        </div>
                        <div className="space-y-4">
                            <Button
                                type="submit"
                                className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105"
                            >
                                Entrar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => navigate('/')}
                                className="w-full bg-transparent border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                            >
                                Voltar
                            </Button>
                        </div>
                        <div className="text-center pt-4 border-t border-yellow-500/20">
                            <p className="text-gray-400">
                                Não tem uma conta?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/register')}
                                    className="text-yellow-500 hover:text-yellow-400 font-semibold transition-colors cursor-pointer"
                                >
                                    Cadastre-se
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;