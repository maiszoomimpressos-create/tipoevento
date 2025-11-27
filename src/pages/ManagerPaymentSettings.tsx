import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, CreditCard, Key, Lock } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSettingsState {
    gatewayName: string;
    apiKey: string;
    apiToken: string;
    // bankAccountDetails: string; // Simplificando para focar nas chaves de API
}

const DEFAULT_SETTINGS: PaymentSettingsState = {
    gatewayName: 'Gateway Padrão',
    apiKey: '',
    apiToken: '',
};

const ManagerPaymentSettings: React.FC = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<PaymentSettingsState>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch Settings
    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showError("Sessão expirada. Faça login novamente.");
                navigate('/manager/login');
                return;
            }
            setUserId(user.id);

            const { data: settingsData, error: settingsError } = await supabase
                .from('payment_settings')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = No rows found
                console.error("Error fetching payment settings:", settingsError);
                showError("Erro ao carregar configurações de pagamento.");
            }

            if (settingsData) {
                // Ao carregar, mostramos apenas os últimos 4 dígitos para segurança
                const maskedApiKey = settingsData.api_key ? '••••••••••••' + settingsData.api_key.slice(-4) : '';
                const maskedApiToken = settingsData.api_token ? '••••••••••••' + settingsData.api_token.slice(-4) : '';

                setSettings({
                    gatewayName: settingsData.gateway_name || DEFAULT_SETTINGS.gatewayName,
                    apiKey: maskedApiKey,
                    apiToken: maskedApiToken,
                });
            }
            
            setIsLoading(false);
        };
        fetchSettings();
    }, [navigate]);

    const handleInputChange = (key: keyof PaymentSettingsState, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!userId) return;
        setIsSaving(true);
        const toastId = showLoading("Salvando configurações de pagamento...");

        // Apenas envia a chave/token se o valor não estiver mascarado (ou seja, se o usuário digitou algo novo)
        const dataToSave: any = {
            user_id: userId,
            gateway_name: settings.gatewayName,
        };

        // Se o valor não começar com '••••', significa que o usuário digitou um novo valor
        if (!settings.apiKey.startsWith('••••')) {
            dataToSave.api_key = settings.apiKey;
        }
        if (!settings.apiToken.startsWith('••••')) {
            dataToSave.api_token = settings.apiToken;
        }

        try {
            // Tenta atualizar (UPSERT) usando user_id como chave de conflito
            const { error } = await supabase
                .from('payment_settings')
                .upsert(dataToSave, { onConflict: 'user_id' });

            if (error) {
                throw error;
            }

            dismissToast(toastId);
            showSuccess("Configurações de pagamento salvas com sucesso!");
            navigate('/manager/settings');

        } catch (e: any) {
            dismissToast(toastId);
            console.error("Supabase Save Error:", e);
            showError(`Falha ao salvar configurações: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-0 text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando configurações de pagamento...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 flex items-center">
                    <CreditCard className="h-7 w-7 mr-3" />
                    Configurações de Pagamento
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
                    <CardTitle className="text-white text-xl sm:text-2xl font-semibold">Integração de Gateway</CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                        Conecte sua conta PRO a gateways de pagamento externos para processar vendas de ingressos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    {/* Aviso de Segurança */}
                    <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-start space-x-3">
                        <Lock className="h-5 w-5 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-white mb-1">Aviso de Segurança</h3>
                            <p className="text-sm text-gray-300">
                                As chaves de API e Tokens são dados sensíveis. Elas são armazenadas de forma segura, mas nunca devem ser compartilhadas publicamente.
                            </p>
                        </div>
                    </div>

                    {/* Nome do Gateway */}
                    <div>
                        <label htmlFor="gatewayName" className="block text-sm font-medium text-white mb-2">Nome do Gateway</label>
                        <Input 
                            id="gatewayName" 
                            type="text"
                            value={settings.gatewayName} 
                            onChange={(e) => handleInputChange('gatewayName', e.target.value)} 
                            placeholder="Ex: Mercado Pago"
                            className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Chave de API */}
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-white mb-2 flex items-center">
                            <Key className="h-4 w-4 mr-2 text-yellow-500" />
                            Chave de API (API Key)
                        </label>
                        <Input 
                            id="apiKey" 
                            type="text"
                            value={settings.apiKey} 
                            onChange={(e) => handleInputChange('apiKey', e.target.value)} 
                            placeholder="Insira a chave de API do seu gateway"
                            className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-gray-500 mt-1">Se você não alterar, a chave existente será mantida.</p>
                    </div>

                    {/* Token Secreto */}
                    <div>
                        <label htmlFor="apiToken" className="block text-sm font-medium text-white mb-2 flex items-center">
                            <Lock className="h-4 w-4 mr-2 text-yellow-500" />
                            Token Secreto (Secret Token)
                        </label>
                        <Input 
                            id="apiToken" 
                            type="text"
                            value={settings.apiToken} 
                            onChange={(e) => handleInputChange('apiToken', e.target.value)} 
                            placeholder="Insira o token secreto do seu gateway"
                            className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-gray-500 mt-1">Se você não alterar, o token existente será mantido.</p>
                    </div>
                    
                    {/* Botões de Ação */}
                    <div className="pt-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Salvando...
                                </div>
                            ) : (
                                <>
                                    <i className="fas fa-save mr-2"></i>
                                    Salvar Configurações
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => navigate('/manager/settings')}
                            variant="outline"
                            className="flex-1 bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                            disabled={isSaving}
                        >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Voltar para Configurações
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerPaymentSettings;