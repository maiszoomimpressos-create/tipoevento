"use client";

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import MultiLineEditor from '@/components/MultiLineEditor';
import { Loader2 } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import ManagerTypeSelectionDialog from '@/components/ManagerTypeSelectionDialog'; // Importando o modal de seleção
import ManagerIndividualRegisterDialog from '@/components/ManagerIndividualRegisterDialog'; // Importando o novo modal de cadastro PF

const ADMIN_MASTER_USER_TYPE_ID = 1;

const ManagerRegister: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);
    const [showIndividualRegisterModal, setShowIndividualRegisterModal] = useState(false); // Novo estado para o modal PF

    const [userId, setUserId] = useState<string | undefined>(undefined);
    React.useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id);
        });
    }, []);
    const { profile, isLoading: isLoadingProfile } = useProfile(userId);

    const isAdminRegisterRoute = location.pathname === '/admin/register-manager';
    const isAdminMaster = profile?.tipo_usuario_id === ADMIN_MASTER_USER_TYPE_ID;

    const shouldShowAgreementCheckbox = !isAdminRegisterRoute;

    const handleAgreeToTerms = (agreed: boolean) => {
        setAgreedToTerms(agreed);
    };

    const handleContinue = () => {
        setShowTypeSelectionModal(true);
    };

    const handleSelectManagerType = (type: 'individual' | 'company') => {
        setShowTypeSelectionModal(false); // Fecha o modal de seleção
        setIsSubmitting(true); // Indica que está processando a navegação
        
        if (type === 'individual') {
            // Abre o modal de cadastro de Pessoa Física
            setShowIndividualRegisterModal(true);
            setIsSubmitting(false); // Não precisa de loading extra aqui, o modal terá seu próprio
        } else {
            showSuccess(`Você selecionou o cadastro como Pessoa Jurídica.`);
            setTimeout(() => {
                setIsSubmitting(false);
                navigate('/manager/register/company'); // Redireciona para a nova página de registro de empresa
            }, 1500);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 py-12">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, #fbbf24 0%, transparent 50%), radial-gradient(circle at 75% 75%, #fbbf24 0%, transparent 50%)',
                    backgroundSize: '400px 400px'
                }}></div>
            </div>
            <div className="relative z-10 w-full max-w-sm sm:max-w-[800px] space-y-6">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                        {isAdminRegisterRoute && isAdminMaster ? "Editar Termos de Registro de Gestor" : "Cadastro de Gestor"}
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base">
                        {isAdminRegisterRoute && isAdminMaster ? "Atualize o conteúdo dos termos para novos gestores." : "Leia e aceite os termos para continuar"}
                    </p>
                </div>
                
                <MultiLineEditor 
                    onAgree={handleAgreeToTerms} 
                    initialAgreedState={agreedToTerms} 
                    showAgreementCheckbox={shouldShowAgreementCheckbox}
                    termsType="manager_registration"
                />

                {!isAdminRegisterRoute && (
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
                )}
            </div>

            {/* Modal de Seleção de Tipo de Gestor */}
            <ManagerTypeSelectionDialog
                isOpen={showTypeSelectionModal}
                onClose={() => setShowTypeSelectionModal(false)}
                onSelectType={handleSelectManagerType}
                isSubmitting={isSubmitting}
            />

            {/* Novo Modal de Cadastro de Gestor PF */}
            <ManagerIndividualRegisterDialog
                isOpen={showIndividualRegisterModal}
                onClose={() => setShowIndividualRegisterModal(false)}
                profile={profile}
                userId={userId}
            />
        </div>
    );
};

export default ManagerRegister;