import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, User, CreditCard, Bell, Loader2, Building, History } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/integrations/supabase/client';
import { useManagerCompany } from '@/hooks/use-manager-company'; // Importando hook da empresa

const ADMIN_MASTER_USER_TYPE_ID = 1;
const MANAGER_PRO_USER_TYPE_ID = 2;

const ManagerSettings: React.FC = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | undefined>(undefined);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id);
        });
    }, []);

    const { profile, isLoading: isLoadingProfile } = useProfile(userId);
    const { company, isLoading: isLoadingCompany } = useManagerCompany(userId);
    
    const isLoading = isLoadingProfile || isLoadingCompany;
    const isAdminMaster = profile?.tipo_usuario_id === ADMIN_MASTER_USER_TYPE_ID;
    const isManagerPro = profile?.tipo_usuario_id === MANAGER_PRO_USER_TYPE_ID;

    // Determina a rota correta para o Perfil da Empresa
    const getCompanyProfilePath = () => {
        // Admin Master sempre gerencia dados PJ (ou a plataforma)
        if (isAdminMaster) {
            return "/manager/settings/company-profile";
        }
        
        // Gestor PRO (Tipo 2)
        if (isManagerPro) {
            // Se o gestor PRO tem um registro de empresa (PJ), ele edita o perfil da empresa.
            if (company?.id) {
                return "/manager/settings/company-profile";
            }
            // Se o gestor PRO NÃO tem registro de empresa (PF), ele edita o perfil individual.
            return "/manager/settings/individual-profile";
        }
        
        // Fallback (deve ser inacessível se o ManagerLayout funcionar corretamente)
        return "/manager/dashboard";
    };

    let settingsOptions = [
        { 
            icon: isManagerPro && !company?.id ? <User className="h-6 w-6 text-yellow-500" /> : <Building className="h-6 w-6 text-yellow-500" />, 
            title: isManagerPro && !company?.id ? "Perfil Pessoal (PF)" : "Perfil da Empresa (PJ)", 
            description: isManagerPro && !company?.id ? "Atualize seus dados pessoais obrigatórios como Gestor PF." : "Atualize informações de contato e dados corporativos.", 
            path: getCompanyProfilePath() 
        },
        { icon: <Bell className="h-6 w-6 text-yellow-500" />, title: "Notificações e Alertas", description: "Defina preferências de notificação por e-mail e sistema.", path: "/manager/settings/notifications" },
    ];
    
    // Adiciona opções específicas para Admin Master
    if (isAdminMaster) {
        settingsOptions.push(
            { icon: <CreditCard className="h-6 w-6 text-yellow-500" />, title: "Configurações de Pagamento", description: "Gerencie contas bancárias e gateways de pagamento.", path: "/manager/settings/payment" },
            { icon: <History className="h-6 w-6 text-yellow-500" />, title: "Histórico de Configurações", description: "Visualize todas as alterações feitas nas configurações da sua conta.", path: "/manager/settings/history" },
            { icon: <Settings className="h-6 w-6 text-yellow-500" />, title: "Configurações Avançadas", description: "Ajustes de sistema, segurança e integrações.", path: "/manager/settings/advanced" }
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 mb-2">Configurações do Gestor</h1>
                <p className="text-gray-400 text-sm sm:text-base">Gerencie as configurações da sua conta PRO e do sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settingsOptions.map((option, index) => (
                    <Card 
                        key={index}
                        className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/60 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 cursor-pointer"
                        onClick={() => option.path !== '#' ? navigate(option.path) : alert(`Funcionalidade ${option.title} em desenvolvimento.`)}
                    >
                        <CardHeader className="p-0 mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {option.icon}
                                </div>
                                <CardTitle className="text-white text-xl">{option.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <CardDescription className="text-gray-400 text-sm">
                                {option.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-10 pt-6 border-t border-yellow-500/20">
                <h2 className="text-xl font-semibold text-white mb-4">Ações de Conta</h2>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <Button 
                        variant="outline"
                        className="bg-black/60 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => alert("Funcionalidade de exclusão de conta em desenvolvimento.")}
                    >
                        <i className="fas fa-trash-alt mr-2"></i>
                        Excluir Conta PRO
                    </Button>
                    <Button 
                        onClick={() => navigate('/manager/dashboard')}
                        className="bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Voltar ao Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ManagerSettings;