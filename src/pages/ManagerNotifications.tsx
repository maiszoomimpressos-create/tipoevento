import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, System, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface SettingsState {
    newSaleEmail: boolean;
    newSaleSystem: boolean;
    eventUpdateEmail: boolean;
    eventUpdateSystem: boolean;
    lowStockEmail: boolean;
    lowStockSystem: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
    newSaleEmail: true,
    newSaleSystem: true,
    eventUpdateEmail: false,
    eventUpdateSystem: true,
    lowStockEmail: true,
    lowStockSystem: true,
};

const ManagerNotifications: React.FC = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // 1. Fetch User ID and Settings
    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showError("Sessão expirada. Faça login novamente.");
                navigate('/manager/login');
                return;
            }
            setUserId(user.id);

            const { data, error } = await supabase
                .from('manager_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
                console.error("Error fetching settings:", error);
                showError("Erro ao carregar configurações de notificação.");
            }

            if (data) {
                setSettings({
                    newSaleEmail: data.new_sale_email ?? DEFAULT_SETTINGS.newSaleEmail,
                    newSaleSystem: data.new_sale_system ?? DEFAULT_SETTINGS.newSaleSystem,
                    eventUpdateEmail: data.event_update_email ?? DEFAULT_SETTINGS.eventUpdateEmail,
                    eventUpdateSystem: data.event_update_system ?? DEFAULT_SETTINGS.eventUpdateSystem,
                    lowStockEmail: data.low_stock_email ?? DEFAULT_SETTINGS.lowStockEmail,
                    lowStockSystem: data.low_stock_system ?? DEFAULT_SETTINGS.lowStockSystem,
                });
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, [navigate]);

    const handleSwitchChange = (key: keyof SettingsState, checked: boolean) => {
        setSettings(prev => ({ ...prev, [key]: checked }));
    };

    const handleSave = async () => {
        if (!userId) return;
        setIsSaving(true);
        const toastId = showLoading("Salvando preferências...");

        const dataToSave = {
            user_id: userId,
            new_sale_email: settings.newSaleEmail,
            new_sale_system: settings.newSaleSystem,
            event_update_email: settings.eventUpdateEmail,
            event_update_system: settings.eventUpdateSystem,
            low_stock_email: settings.lowStockEmail,
            low_stock_system: settings.lowStockSystem,
        };

        try {
            // Tenta atualizar (UPSERT)
            const { error } = await supabase
                .from('manager_settings')
                .upsert(dataToSave, { onConflict: 'user_id' });

            if (error) {
                throw error;
            }

            dismissToast(toastId);
            showSuccess("Preferências de notificação salvas com sucesso!");
            navigate('/manager/settings');

        } catch (e: any) {
            dismissToast(toastId);
            console.error("Supabase Save Error:", e);
            showError(`Falha ao salvar preferências: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-0 text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando configurações...</p>
            </div>
        );
    }

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
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Salvando...
                                </div>
                            ) : (
                                <>
                                    <i className="fas fa-save mr-2"></i>
                                    Salvar Preferências
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerNotifications;