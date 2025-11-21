import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, System, ArrowLeft } from 'lucide-react';

const ManagerNotifications: React.FC = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        newSaleEmail: true,
        newSaleSystem: true,
        eventUpdateEmail: false,
        eventUpdateSystem: true,
        lowStockEmail: true,
        lowStockSystem: true,
    });

    const handleSwitchChange = (key: keyof typeof settings, checked: boolean) => {
        setSettings(prev => ({ ...prev, [key]: checked }));
        // Em um app real, aqui você chamaria a API para salvar a preferência
        console.log(`Setting ${key} updated to: ${checked}`);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 flex items-center">
                    <Bell className="h-7 w-7 mr-3" />
                    Notificações e Alertas
                </h1>
                <Button 
                    onClick={() => navigate('/manager/settings')}
                    variant="outline"
                    className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
            </div>

            <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10">
                <CardHeader>
                    <CardTitle className="text-white text-xl sm:text-2xl font-semibold">Preferências de Alerta</CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                        Defina como você deseja receber alertas sobre vendas, eventos e estoque.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* Alertas de Vendas */}
                    <div className="space-y-4 pt-4 border-t border-yellow-500/10">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <i className="fas fa-dollar-sign mr-2 text-yellow-500"></i>
                            Alertas de Vendas
                        </h3>
                        
                        <div className="flex items-center justify-between p-4 bg-black/60 rounded-xl border border-yellow-500/20">
                            <div>
                                <p className="text-white font-medium">Nova Venda (E-mail)</p>
                                <p className="text-gray-400 text-xs">Receba um e-mail a cada nova transação.</p>
                            </div>
                            <Switch 
                                checked={settings.newSaleEmail} 
                                onCheckedChange={(checked) => handleSwitchChange('newSaleEmail', checked)}
                                className="data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-gray-700"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black/60 rounded-xl border border-yellow-500/20">
                            <div>
                                <p className="text-white font-medium">Nova Venda (Notificação no Sistema)</p>
                                <p className="text-gray-400 text-xs">Alerta visual no Dashboard PRO.</p>
                            </div>
                            <Switch 
                                checked={settings.newSaleSystem} 
                                onCheckedChange={(checked) => handleSwitchChange('newSaleSystem', checked)}
                                className="data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-gray-700"
                            />
                        </div>
                    </div>

                    {/* Alertas de Eventos */}
                    <div className="space-y-4 pt-4 border-t border-yellow-500/10">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <i className="fas fa-calendar-alt mr-2 text-yellow-500"></i>
                            Alertas de Eventos
                        </h3>
                        
                        <div className="flex items-center justify-between p-4 bg-black/60 rounded-xl border border-yellow-500/20">
                            <div>
                                <p className="text-white font-medium">Atualização de Evento (E-mail)</p>
                                <p className="text-gray-400 text-xs">Notificações sobre alterações de data ou local.</p>
                            </div>
                            <Switch 
                                checked={settings.eventUpdateEmail} 
                                onCheckedChange={(checked) => handleSwitchChange('eventUpdateEmail', checked)}
                                className="data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-gray-700"
                            />
                        </div>
                    </div>

                    {/* Alertas de Estoque */}
                    <div className="space-y-4 pt-4 border-t border-yellow-500/10">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <i className="fas fa-box-open mr-2 text-yellow-500"></i>
                            Alertas de Estoque
                        </h3>
                        
                        <div className="flex items-center justify-between p-4 bg-black/60 rounded-xl border border-yellow-500/20">
                            <div>
                                <p className="text-white font-medium">Ingressos com Baixo Estoque (Sistema)</p>
                                <p className="text-gray-400 text-xs">Alerta quando a disponibilidade de ingressos cai abaixo de 10%.</p>
                            </div>
                            <Switch 
                                checked={settings.lowStockSystem} 
                                onCheckedChange={(checked) => handleSwitchChange('lowStockSystem', checked)}
                                className="data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-gray-700"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={() => navigate('/manager/settings')}
                            className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                        >
                            <i className="fas fa-save mr-2"></i>
                            Salvar Preferências
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerNotifications;