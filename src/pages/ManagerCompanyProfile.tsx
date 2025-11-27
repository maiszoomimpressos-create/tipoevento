import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Loader2, Building, ArrowLeft, User, AlertTriangle } from 'lucide-react';
import CompanyForm, { companySchema, CompanyFormData } from '@/components/CompanyForm';
import { useProfile } from '@/hooks/use-profile'; // Importando useProfile
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Importando componentes de Tabs

// Campos essenciais do perfil do usuário que devem estar preenchidos
const ESSENTIAL_PROFILE_FIELDS = [
    'first_name', 'last_name', 'cpf', 'rg', 'birth_date', 'gender',
    'cep', 'rua', 'bairro', 'cidade', 'estado', 'numero', 'complemento' // 'complemento' agora é obrigatório para gestores
];

const isProfileComplete = (profileData: typeof useProfile extends (...args: any[]) => { profile: infer T } ? T : never): boolean => {
    if (!profileData) return false;

    for (const field of ESSENTIAL_PROFILE_FIELDS) {
        const value = profileData[field as keyof typeof profileData];
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
            return false;
        }
    }
    return true;
};

const ManagerCompanyProfile: React.FC = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null); // Para exibir o e-mail do usuário
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("company-info"); // Estado para controlar a aba ativa

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
            setUserEmail(user.email); // Define o e-mail do usuário
            setIsFetching(false);
        };
        fetchUser();
    }, [navigate]);

    // Fetch user profile for 'Sócios' tab
    const { profile, isLoading: isLoadingProfile } = useProfile(userId || undefined);

    const form = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            cnpj: '',
            corporate_name: '',
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

    // Fetch Company Data
    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!userId) return;

            const { data: companiesData, error } = await supabase
                .from('companies')
                .select('*')
                .eq('user_id', userId)
                .limit(1);

            if (error) {
                console.error("Error fetching company profile:", error);
                showError("Erro ao carregar perfil da empresa.");
            }

            const data = companiesData?.[0];
            if (data) {
                setCompanyId(data.id);
                form.reset({
                    cnpj: data.cnpj ? data.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : '',
                    corporate_name: data.corporate_name || '',
                    trade_name: data.trade_name || '',
                    phone: data.phone ? data.phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : '',
                    email: data.email || '',
                    cep: data.cep ? data.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '',
                    street: data.street || '',
                    neighborhood: data.neighborhood || '',
                    city: data.localidade || '', // Corrigido para 'localidade' do ViaCEP
                    state: data.uf || '', // Corrigido para 'uf' do ViaCEP
                    number: data.number || '',
                    complement: data.complement || '',
                });
            }
            setIsFetching(false);
        };
        if (userId) {
            fetchCompanyData();
        }
    }, [userId, form]);

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
        if (!userId) return;
        setIsSaving(true);
        const toastId = showLoading(companyId ? "Atualizando perfil..." : "Cadastrando perfil...");

        const dataToSave = {
            user_id: userId,
            cnpj: values.cnpj.replace(/\D/g, ''),
            corporate_name: values.corporate_name,
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
            let error;
            if (companyId) {
                // Update existing profile
                const result = await supabase
                    .from('companies')
                    .update(dataToSave)
                    .eq('id', companyId);
                error = result.error;
            } else {
                // Insert new profile
                const result = await supabase
                    .from('companies')
                    .insert([dataToSave])
                    .select('id')
                    .single();
                error = result.error;
                if (result.data) {
                    setCompanyId(result.data.id);
                }
            }

            if (error) {
                if (error.code === '23505' && error.message.includes('cnpj')) {
                    throw new Error("Este CNPJ já está cadastrado em outra conta.");
                }
                throw error;
            }

            dismissToast(toastId);
            showSuccess("Perfil da Empresa salvo com sucesso!");
            navigate('/manager/settings');

        } catch (e: any) {
            dismissToast(toastId);
            console.error("Supabase Save Error:", e);
            showError(`Falha ao salvar perfil: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetching || isLoadingProfile) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-0 text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando perfil da empresa...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 flex items-center">
                    <Building className="h-7 w-7 mr-3" />
                    Perfil da Empresa
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
                    <CardTitle className="text-white text-xl sm:text-2xl font-semibold">
                        {companyId ? "Editar Dados Corporativos" : "Cadastrar Dados Corporativos"}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                        Estes dados são essenciais para a emissão de notas fiscais e validação de eventos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="company-info" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-yellow-500/30 text-white">
                            <TabsTrigger 
                                value="company-info" 
                                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=inactive]:text-white hover:bg-yellow-500/10"
                            >
                                <Building className="h-4 w-4 mr-2" /> Informações da Empresa
                            </TabsTrigger>
                            <TabsTrigger 
                                value="partners" 
                                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=inactive]:text-white hover:bg-yellow-500/10"
                            >
                                <User className="h-4 w-4 mr-2" /> Sócios
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="company-info" className="mt-6">
                            <FormProvider {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <CompanyForm 
                                        isSaving={isSaving} 
                                        isCepLoading={isCepLoading} 
                                        fetchAddressByCep={fetchAddressByCep} 
                                    />

                                    <div className="pt-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                        <Button
                                            type="submit"
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
                                                    Salvar Perfil da Empresa
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => navigate('/manager/settings')}
                                            variant="outline"
                                            className="flex-1 bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                                            disabled={isSaving}
                                        >
                                            <ArrowLeft className="mr-2 h-5 w-5" />
                                            Voltar para Configurações
                                        </Button>
                                    </div>
                                </form>
                            </FormProvider>
                        </TabsContent>
                        <TabsContent value="partners" className="mt-6">
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-white border-b border-yellow-500/10 pb-2 flex items-center">
                                    <User className="h-5 w-5 mr-2 text-yellow-500" />
                                    Dados do Sócio Principal (Você)
                                </h3>
                                {!isProfileComplete(profile) && (
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
                                            <p><span className="font-medium text-white">Nome:</span> {profile.first_name} {profile.last_name}</p>
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
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerCompanyProfile;