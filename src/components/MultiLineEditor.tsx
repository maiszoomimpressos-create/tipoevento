"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Edit, Save, CheckSquare, XSquare, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface MultiLineEditorProps {
    onAgree: (agreed: boolean) => void;
    initialAgreedState?: boolean;
}

const ADMIN_MASTER_USER_TYPE_ID = 1;

// Hook para buscar os termos e condições
const fetchTermsAndConditions = async () => {
    const { data, error } = await supabase
        .from('terms_and_conditions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        throw error;
    }
    return data;
};

const MultiLineEditor: React.FC<MultiLineEditorProps> = ({ onAgree, initialAgreedState = false }) => {
    const queryClient = useQueryClient();
    const { data: termsData, isLoading: isLoadingTerms, isError: isErrorTerms, refetch } = useQuery({
        queryKey: ['termsAndConditions'],
        queryFn: fetchTermsAndConditions,
        enabled: true, // Sempre tenta buscar os termos
        staleTime: 1000 * 60 * 60, // Cache por 1 hora
        onError: (error) => {
            console.error("Erro ao carregar termos e condições:", error);
            showError("Erro ao carregar os termos e condições. Tente recarregar a página.");
        }
    });

    const [userId, setUserId] = useState<string | undefined>(undefined);
    const { profile, isLoading: isLoadingProfile } = useProfile(userId);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const [agreed, setAgreed] = useState(initialAgreedState);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id);
        });
    }, []);

    useEffect(() => {
        if (termsData?.content) {
            setEditedContent(termsData.content);
        }
    }, [termsData]);

    const isAdminMaster = profile?.tipo_usuario_id === ADMIN_MASTER_USER_TYPE_ID;
    const isClient = profile?.tipo_usuario_id === 3; // Tipo 3 é cliente

    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            // Considera que o usuário rolou até o final se estiver a 10px do fim
            if (scrollHeight - scrollTop <= clientHeight + 10) {
                setHasScrolledToEnd(true);
            }
        }
    };

    const handleCheckboxChange = (checked: boolean) => {
        setAgreed(checked);
        onAgree(checked);
    };

    const handleSave = async () => {
        if (!userId || !isAdminMaster) {
            showError("Você não tem permissão para editar os termos.");
            return;
        }
        if (!editedContent.trim()) {
            showError("O conteúdo dos termos não pode estar vazio.");
            return;
        }

        setIsSaving(true);
        const toastId = showLoading("Salvando termos e condições...");

        try {
            const { error } = await supabase
                .from('terms_and_conditions')
                .upsert(
                    { 
                        id: termsData?.id, // Se existir, atualiza; senão, insere um novo
                        content: editedContent, 
                        updated_by: userId,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'id' } // Tenta atualizar pelo ID, se não existir, insere
                );

            if (error) {
                throw error;
            }

            dismissToast(toastId);
            showSuccess("Termos e condições atualizados com sucesso!");
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['termsAndConditions'] }); // Invalida a query para forçar a re-busca
            refetch(); // Rebusca os termos para garantir que o cache seja atualizado

        } catch (e: any) {
            dismissToast(toastId);
            console.error("Erro ao salvar termos:", e);
            showError(`Falha ao salvar termos: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingTerms || isLoadingProfile) {
        return (
            <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                <div className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-400">Carregando termos e condições...</p>
                </div>
            </Card>
        );
    }

    if (isErrorTerms || !termsData) {
        return (
            <Card className="bg-black/80 backdrop-blur-sm border border-red-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                <CardHeader>
                    <CardTitle className="text-red-400 text-xl">Erro ao Carregar Termos</CardTitle>
                    <CardDescription className="text-gray-400">Não foi possível carregar os termos e condições. Por favor, tente novamente mais tarde.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-white text-xl sm:text-2xl font-semibold flex items-center">
                    <CheckSquare className="h-6 w-6 mr-3 text-yellow-500" />
                    Termos e Condições
                </CardTitle>
                {isAdminMaster && (
                    <Button 
                        onClick={() => setIsEditing(!isEditing)}
                        variant="outline"
                        className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm h-9 px-4"
                        disabled={isSaving}
                    >
                        {isEditing ? (
                            <>
                                <XSquare className="mr-2 h-4 w-4" />
                                Cancelar Edição
                            </>
                        ) : (
                            <>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Termos
                            </>
                        )}
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div 
                    ref={contentRef}
                    onScroll={isClient ? handleScroll : undefined} // Apenas clientes precisam rolar até o final
                    className="max-h-96 overflow-y-auto p-2 bg-black/60 border border-yellow-500/20 rounded-xl text-gray-300 text-sm leading-relaxed whitespace-pre-wrap"
                >
                    {isEditing ? (
                        <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-full bg-transparent border-none focus:ring-0 text-white resize-none"
                            rows={15}
                            disabled={isSaving}
                        />
                    ) : (
                        termsData.content
                    )}
                </div>

                {isAdminMaster && isEditing && (
                    <div className="flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !editedContent.trim()}
                            className="bg-yellow-500 text-black hover:bg-yellow-600 py-2 text-base font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 h-10"
                        >
                            {isSaving ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Salvando...
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    </div>
                )}

                <div className="flex items-center space-x-3 pt-4 border-t border-yellow-500/10">
                    <Checkbox 
                        id="agreeTerms" 
                        checked={agreed}
                        onCheckedChange={handleCheckboxChange}
                        disabled={isClient && !hasScrolledToEnd} // Desabilitado para clientes até rolar
                        className="border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                    />
                    <label htmlFor="agreeTerms" className="text-sm font-medium text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Eu li e concordo com os Termos e Condições.
                    </label>
                </div>
                {isClient && !hasScrolledToEnd && (
                    <p className="text-xs text-red-400 mt-2 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Role até o final para habilitar a opção de concordar.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default MultiLineEditor;