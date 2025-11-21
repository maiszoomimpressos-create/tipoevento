import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Loader2, Building, ArrowLeft } from 'lucide-react';

// --- Utility Functions ---

const validateCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
};

const formatCNPJ = (value: string) => {
    if (!value) return '';
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const formatPhone = (value: string) => {
    if (!value) return '';
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 10) {
        return cleanValue.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    return cleanValue.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
};

const formatCEP = (value: string) => {
    if (!value) return '';
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

// --- Zod Schema ---

const companyProfileSchema = z.object({
    cnpj: z.string().refine(validateCNPJ, { message: "CNPJ inválido (14 dígitos)." }),
    corporate_name: z.string().min(3, { message: "Razão Social é obrigatória." }),
    trade_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    
    // Address Fields
    cep: z.string().optional().nullable().refine((val) => !val || val.replace(/\D/g, '').length === 8, { message: "CEP inválido (8 dígitos)." }),
    street: z.string().optional().nullable(),
    neighborhood: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    number: z.string().optional().nullable(),
    complement: z.string().optional().nullable(),
});

type CompanyProfileData = z.infer<typeof companyProfileSchema> & { id?: string };

// --- Component ---

const ManagerCompanyProfile: React.FC = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isCepLoading, setIsCepLoading] = useState(false);

    const form = useForm<CompanyProfileData>({
        resolver: zodResolver(companyProfileSchema),
        defaultValues: {
            cnpj: '',
            corporate_name: '',
            trade_name: '',
            phone: '',
            cep: '',
            street: '',
            neighborhood: '',
            city: '',
            state: '',
            number: '',
            complement: '',
        },
    });

    // Fetch Data
    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showError("Sessão expirada. Faça login novamente.");
                navigate('/manager/login');
                return;
            }
            setUserId(user.id);

            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
                console.error("Error fetching company profile:", error);
                showError("Erro ao carregar perfil da empresa.");
            }

            if (data) {
                setCompanyId(data.id);
                form.reset({
                    cnpj: formatCNPJ(data.cnpj || ''),
                    corporate_name: data.corporate_name || '',
                    trade_name: data.trade_name || '',
                    phone: formatPhone(data.phone || ''),
                    cep: formatCEP(data.cep || ''),
                    street: data.street || '',
                    neighborhood: data.neighborhood || '',
                    city: data.city || '',
                    state: data.state || '',
                    number: data.number || '',
                    complement: data.complement || '',
                });
            }
            setIsFetching(false);
        };
        fetchProfile();
    }, [navigate, form]);

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

    // --- Handlers ---

    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedCnpj = formatCNPJ(e.target.value);
        form.setValue('cnpj', formattedCnpj, { shouldValidate: true });
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedPhone = formatPhone(e.target.value);
        form.setValue('phone', formattedPhone, { shouldValidate: true });
    };

    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formattedCep = formatCEP(rawValue);
        form.setValue('cep', formattedCep, { shouldValidate: true });

        if (formattedCep.replace(/\D/g, '').length === 8) {
            fetchAddressByCep(formattedCep);
        }
    };

    const onSubmit = async (values: CompanyProfileData) => {
        if (!userId) return;
        setIsSaving(true);
        const toastId = showLoading(companyId ? "Atualizando perfil..." : "Cadastrando perfil...");

        const dataToSave = {
            user_id: userId,
            cnpj: values.cnpj.replace(/\D/g, ''),
            corporate_name: values.corporate_name,
            trade_name: values.trade_name || null,
            phone: values.phone ? values.phone.replace(/\D/g, '') : null,
            
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

    if (isFetching) {
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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            {/* Seção de Dados Corporativos */}
                            <div className="space-y-6 pt-4">
                                <h3 className="text-lg font-semibold text-white border-b border-yellow-500/10 pb-2">Informações Básicas</h3>
                                
                                <FormField
                                    control={form.control}
                                    name="cnpj"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">CNPJ *</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="00.000.000/0000-00"
                                                    {...field} 
                                                    onChange={handleCnpjChange}
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" 
                                                    maxLength={18}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="corporate_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Razão Social *</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Nome da Empresa S.A."
                                                    {...field} 
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="trade_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Nome Fantasia (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Nome Comercial"
                                                        {...field} 
                                                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Telefone (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="(00) 00000-0000"
                                                        {...field} 
                                                        onChange={handlePhoneChange}
                                                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" 
                                                        maxLength={15}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Seção de Endereço */}
                            <div className="space-y-6 pt-4 border-t border-yellow-500/10">
                                <h3 className="text-lg font-semibold text-white border-b border-yellow-500/10 pb-2">Endereço</h3>
                                
                                <FormField
                                    control={form.control}
                                    name="cep"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">CEP (Opcional)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input 
                                                        placeholder="00000-000"
                                                        {...field} 
                                                        onChange={handleCepChange}
                                                        disabled={isCepLoading} 
                                                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 pr-10" 
                                                        maxLength={9}
                                                    />
                                                    {isCepLoading && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="street"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Rua (Opcional)</FormLabel>
                                                    <FormControl>
                                                        <Input id="street" placeholder="Ex: Av. Paulista" {...field} disabled={isCepLoading} className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Número (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input id="number" placeholder="123" {...field} disabled={isCepLoading} className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="complement"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Complemento (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Apto 101, Bloco B" {...field} disabled={isCepLoading} className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="neighborhood"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Bairro (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Jardim Paulista" {...field} disabled={isCepLoading} className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Cidade (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="São Paulo" {...field} disabled={isCepLoading} className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Estado (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="SP" {...field} disabled={isCepLoading} className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
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
                                            Salvar Perfil da Empresa
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerCompanyProfile;