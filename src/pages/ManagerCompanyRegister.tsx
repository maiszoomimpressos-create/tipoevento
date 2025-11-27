import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Loader2, Building, ArrowLeft, User, AlertTriangle } from 'lucide-react';
import CompanyForm, { createCompanySchema, CompanyFormData } from '@/components/CompanyForm'; // Importando o novo componente e schema
import { useProfile } from '@/hooks/use-profile'; // Importando useProfile
import { useProfileStatus, isValueEmpty } from '@/hooks/use-profile-status'; // Importando useProfileStatus e isValueEmpty

// Campos essenciais do perfil do usuário que devem estar preenchidos para ser sócio
const ESSENTIAL_PROFILE_FIELDS_FOR_PARTNER = [
    'first_name', 'last_name', 'cpf', 'rg', 'birth_date', 'gender',
    'cep', 'rua', 'bairro', 'cidade', 'estado', 'numero'
];

const isProfileCompleteForPartner = (profileData: typeof useProfile extends (...args: any[]) => { profile: infer T } ? T : never): boolean => {
    if (!profileData) return false;

    for (const field of ESSENTIAL_PROFILE_FIELDS_FOR_PARTNER) {
        const value = profileData[field as keyof typeof profileData];
        if (isValueEmpty(value)) {
            return false;
        }
    }
    return true;
};

const ManagerCompanyRegister: React.FC = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isFetchingUser, setIsFetchingUser] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);

    // Fetch current user ID and Email
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showError("Sessão expirada. Faça login novamente.");
                navigate('/manager/login');
                return;
            }
            setUserId(user.id);
            setUserEmail(user.email);
            setIsFetchingUser(false);
        };
        fetchUser();
    }, [navigate]);

    // Fetch user profile for 'Sócios' tab
    const { profile, isLoading: isLoadingProfile } = useProfile(userId || undefined);
    const isPersonalProfileComplete = isProfileCompleteForPartner(profile);

    // Para o registro de empresa, todos os campos são obrigatórios
    const currentCompanySchema = createCompanySchema(true); 

    const form = useForm<CompanyFormData>({
        resolver: zodResolver(currentCompanySchema), 
        defaultValues: {
            corporate_name: '',
            cnpj: '',
            trade_name: '',
            phone: '',
            email: '',
            cep: '',
            street: '',
            neighborhood: '',
            city: '',
            state: '',
            number: '',
            complement: '',
        },
    });

    // Function to fetch address via ViaCEP
    const fetchAddressByCep = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setIsCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                showError("CEP não encontrado.");
                form.setError('cep', { message: "CEP não encontrado." });
                form.setValue('street', '');
                form.setValue('neighborhood', '');
                form.setValue('city', '');
                form.setValue('state', '');
            } else {
                form.clearErrors('cep');
                form.setValue('street', data.logradouro || '');
                form.setValue('neighborhood', data.bairro || '');
                form.setValue('city', data.localidade || '');
                form.setValue('state', data.uf || '');
                document.getElementById('number')?.focus();
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            showError("Erro na comunicação com o serviço de CEP.");
        } finally {
            setIsCepLoading(false);
        }
    };

    const onSubmit = async (values: CompanyFormData) => {
        if (!userId) {
            showError("Usuário não autenticado.");
            return;
        }
        
        // Validação do perfil do sócio antes de prosseguir
        if (!profile || !isPersonalProfileComplete) {
            showError("Seu perfil pessoal está incompleto. Por favor, preencha todos os dados essenciais do seu perfil antes de registrar a empresa.");
            return;
        }

        setIsSaving(true);
        const toastId = showLoading("Registrando empresa...");

        const dataToSave = {
            user_id: userId,
            cnpj: values.cnpj ? values.cnpj.replace(/\D/g, '') : null,
            corporate_name: values.corporate_name || null,
            trade_name: values.trade_name || null,
            phone: values.phone ? values.phone.replace(/\D/g, '') : null,
            email: values.email || null,
            
            cep: values.cep ? values.cep.replace(/\D/g, '') : null,
            street: values.street || null,
            number: values.number || null,
            neighborhood: values.neighborhood || null,
            city: values.city || null,
            state: values.state || null,
            complement: values.complement || null,
        };

        try {
            // 1. Insert new company profile
            const { error: insertError } = await supabase
                .from('companies')
                .insert([dataToSave]);

            if (insertError) {
                if (insertError.code === '23505' && insertError.message.includes('cnpj')) {
                    throw new Error("Este CNPJ já está cadastrado em outra conta.");
                }
                throw insertError;
            }

            // 2. Update user's profile to set tipo_usuario_id to 2 (Gestor PRO)
            const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ tipo_usuario_id: 2 })
                .eq('id', userId);

            if (updateProfileError) {
                console.error("Erro ao atualizar tipo de usuário no perfil:", updateProfileError);
                // Decide if you want to roll back company creation or just log
                // For now, we'll let it proceed but log the error.
            }

            dismissToast(toastId);
            showSuccess("Empresa registrada e perfil de gestor atualizado com sucesso!");
            navigate('/manager/dashboard');

        } catch (e: any) {
            dismissToast(toastId);
            console.error("Supabase Save Error:", e);
            showError(`Falha ao registrar empresa: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetchingUser || isLoadingProfile) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-0 text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando dados do usuário...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0 py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 flex items-center">
                    <Building className="h-7 w-7 mr-3" />
                    Registro de Empresa (Gestor PRO)
                </h1>
                <Button 
                    onClick={() => navigate('/manager/register')}
                    variant="outline"
                    className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
            </div>

            <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10">
                <CardHeader>
                    <CardTitle className="text-white text-xl sm:text-2xl font-semibold">
                        Dados Corporativos
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                        Preencha os dados da sua empresa para ativar sua conta de gestor PRO.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FormProvider {...form}> {/* Usando FormProvider */}
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <CompanyForm 
                                isSaving={isSaving} 
                                isCepLoading={isCepLoading} 
                                fetchAddressByCep={fetchAddressByCep} 
                                isManagerContext={true} // Sempre true para registro de empresa
                            />

                            {/* Seção de Sócios (Dados do Usuário Logado) */}
                            <div className="space-y-6 pt-4 border-t border-yellow-500/10">
                                <h3 className="text-lg font-semibold text-white border-b border-yellow-500/10 pb-2 flex items-center">
                                    <User className="h-5 w-5 mr-2 text-yellow-500" />
                                    Dados do Sócio (Você)
                                </h3>
                                {!isPersonalProfileComplete && (
                                    <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-start space-x-3 mb-4">
                                        <AlertTriangle className="h-5 w-5 mt-1 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-white mb-1">Perfil Pessoal Incompleto</h4>
                                            <p className="text-sm text-gray-300">
                                                Seu perfil pessoal está incompleto. Por favor, preencha todos os campos essenciais do seu perfil para garantir a correta associação como sócio.
                                            </p>
                                            <Button 
                                                variant="link" 
                                                className="h-auto p-0 mt-2 text-xs text-yellow-500 hover:text-yellow-400"
                                                onClick={() => navigate('/profile')}
                                            >
                                                Ir para o Perfil Pessoal
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {profile ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                                        <div>
                                            <p><span className="font-medium text-white">Nome:</span> {profile.first_name || 'N/A'} {profile.last_name || ''}</p>
                                            <p><span className="font-medium text-white">CPF:</span> {profile.cpf ? profile.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : 'N/A'}</p>
                                            <p><span className="font-medium text-white">RG:</span> {profile.rg || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p><span className="font-medium text-white">Nascimento:</span> {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                            <p><span className="font-medium text-white">Gênero:</span> {profile.gender || 'N/A'}</p>
                                            <p><span className="font-medium text-white">E-mail:</span> {userEmail || 'N/A'}</p>
                                        </div>
                                        <div className="md:col-span-2 text-xs text-gray-500 pt-2 border-t border-yellow-500/10">
                                            <p>Estes dados são do seu perfil de usuário e estão associados à empresa como sócio principal.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-400">
                                        <Loader2 className="h-6 w-6 animate-spin text-yellow-500 mx-auto mb-2" />
                                        Carregando dados do seu perfil...
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <Button
                                    type="submit"
                                    disabled={isSaving || !isPersonalProfileComplete} 
                                    className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Registrando...
                                        </div>
                                    ) : (
                                        <>
                                            <Building className="w-5 h-5 mr-2" />
                                            Registrar Empresa
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => navigate('/manager/register')}
                                    variant="outline"
                                    className="flex-1 bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                                    disabled={isSaving}
                                >
                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                    Voltar
                                </Button>
                            </div>
                        </form>
                    </FormProvider>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerCompanyRegister;