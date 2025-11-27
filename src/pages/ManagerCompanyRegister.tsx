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
import { Loader2, Building, ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile'; // Para puxar dados do sócio

// --- Utility Functions (Copied from ManagerCompanyProfile.tsx) ---

const validateCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    if (cleanCNPJ.length !== 14) return false;

    // Evita CNPJs com todos os dígitos iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    const digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;

    // Validação do primeiro dígito
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Validação do segundo dígito
    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
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

const companyRegisterSchema = z.object({
    corporate_name: z.string().min(3, { message: "Razão Social é obrigatória." }),
    cnpj: z.string().refine(validateCNPJ, { message: "CNPJ inválido. Verifique os dígitos." }),
    trade_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email({ message: "E-mail inválido." }).optional().nullable(),
    
    // Address Fields
    cep: z.string().optional().nullable().refine((val) => !val || val.replace(/\D/g, '').length === 8, { message: "CEP inválido (8 dígitos)." }),
    street: z.string().optional().nullable(),
    neighborhood: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    number: z.string().optional().nullable(),
    complement: z.string().optional().nullable(),
});

type CompanyRegisterData = z.infer<typeof companyRegisterSchema>;

// --- Component ---

const ManagerCompanyRegister: React.FC = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | null>(null);
    const [isFetchingUser, setIsFetchingUser] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);

    // Fetch current user ID
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showError("Sessão expirada. Faça login novamente.");
                navigate('/manager/login');
                return;
            }
            setUserId(user.id);
            setIsFetchingUser(false);
        };
        fetchUser();
    }, [navigate]);

    // Fetch user profile for 'Sócios' tab
    const { profile, isLoading: isLoadingProfile } = useProfile(userId || undefined);

    const form = useForm<CompanyRegisterData>({
        resolver: zodResolver(companyRegisterSchema),
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

    const onSubmit = async (values: CompanyRegisterData) => {
        if (!userId) {
            showError("Usuário não autenticado.");
            return;
        }
        setIsSaving(true);
        const toastId = showLoading("Registrando empresa...");

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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            {/* Seção de Dados Corporativos */}
                            <div className="space-y-6 pt-4">
                                <h3 className="text-lg font-semibold text-white border-b border-yellow-500/10 pb-2">Informações da Empresa</h3>
                                
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
                                
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">E-mail da Empresa (Para Notificações)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="contato@empresa.com"
                                                    {...field} 
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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

                            {/* Seção de Sócios (Dados do Usuário Logado) */}
                            <div className="space-y-6 pt-4 border-t border-yellow-500/10">
                                <h3 className="text-lg font-semibold text-white border-b border-yellow-500/10 pb-2 flex items-center">
                                    <User className="h-5 w-5 mr-2 text-yellow-500" />
                                    Dados do Sócio (Você)
                                </h3>
                                {profile ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                                        <div>
                                            <p><span className="font-medium text-white">Nome:</span> {profile.first_name} {profile.last_name}</p>
                                            <p><span className="font-medium text-white">CPF:</span> {formatCNPJ(profile.cpf || '')}</p> {/* Reutilizando formatCNPJ para CPF */}
                                            <p><span className="font-medium text-white">RG:</span> {profile.rg || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p><span className="font-medium text-white">Nascimento:</span> {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                            <p><span className="font-medium text-white">Gênero:</span> {profile.gender || 'N/A'}</p>
                                            <p><span className="font-medium text-white">E-mail:</span> {supabase.auth.getUser().then(({ data: { user } }) => user?.email)}</p>
                                        </div>
                                        <div className="md:col-span-2 text-xs text-gray-500 pt-2 border-t border-yellow-500/10">
                                            <p>Estes dados são do seu perfil de usuário e serão associados à empresa como sócio principal.</p>
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
                                    disabled={isSaving}
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
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerCompanyRegister;