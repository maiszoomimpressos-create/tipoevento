import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import AuthStatusMenu from '@/components/AuthStatusMenu';
import AvatarUpload from '@/components/AvatarUpload';

const GENDER_OPTIONS = [
    "Masculino",
    "Feminino",
    "Não binário",
    "Outro",
    "Prefiro não dizer"
];

const profileSchema = z.object({
    first_name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
    birth_date: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Data de nascimento é obrigatória." }),
    gender: z.string().min(1, { message: "Gênero é obrigatório." }), // Adicionado Gênero ao esquema
});

interface ProfileData {
    first_name: string;
    avatar_url: string | null;
    cpf: string | null;
    rg: string | null;
    birth_date: string | null;
    gender: string | null; // Adicionado Gênero
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: '',
            birth_date: '',
            gender: '',
        },
    });

    const formatCPF = (value: string) => {
        if (!value) return '';
        const cleanValue = value.replace(/\D/g, '');
        return cleanValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const formatRG = (value: string) => {
        if (!value) return '';
        const cleanValue = value.replace(/\D/g, '');
        // Formato comum de RG (XX.XXX.XXX-X)
        return cleanValue
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1})/, '$1-$2')
            .replace(/(-\d{1})\d+?$/, '$1');
    };

    useEffect(() => {
        const getSessionAndProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setSession(session);

            const { data, error } = await supabase
                .from('profiles')
                .select('first_name, avatar_url, cpf, rg, birth_date, gender') // Incluindo Gênero
                .eq('id', session.user.id)
                .single();

            if (error) {
                showError("Não foi possível carregar seu perfil.");
                console.error(error);
            } else if (data) {
                setProfile(data);
                form.reset({ 
                    first_name: data.first_name || '',
                    birth_date: data.birth_date || '',
                    gender: data.gender || '', // Definindo valor padrão para o formulário
                });
            }
            setLoading(false);
        };
        getSessionAndProfile();
    }, [navigate, form]);

    const onSubmit = async (values: z.infer<typeof profileSchema>) => {
        if (!session) return;
        setFormLoading(true);
        const { error } = await supabase
            .from('profiles')
            .update({ 
                first_name: values.first_name,
                birth_date: values.birth_date,
                gender: values.gender, // Salvando Gênero
            })
            .eq('id', session.user.id);

        if (error) {
            showError("Erro ao atualizar o perfil.");
        } else {
            showSuccess("Perfil atualizado com sucesso!");
            setProfile(prev => prev ? { ...prev, first_name: values.first_name, birth_date: values.birth_date, gender: values.gender } : null);
            setIsEditing(false);
        }
        setFormLoading(false);
    };

    const handleAvatarUpload = (newUrl: string) => {
        setProfile(prev => prev ? { ...prev, avatar_url: newUrl } : null);
    };

    const handleCancelEdit = () => {
        if (profile) {
            form.reset({
                first_name: profile.first_name || '',
                birth_date: profile.birth_date || '',
                gender: profile.gender || '',
            });
        }
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-full max-w-4xl p-6 space-y-8">
                    <Skeleton className="h-10 w-1/3" />
                    <Card className="bg-black/80 border-yellow-500/30">
                        <CardHeader>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-24 w-24 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                            </div>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-12 w-32" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const initials = profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="min-h-screen bg-black text-white">
             <header className="fixed top-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-md border-b border-yellow-500/20">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <div className="text-2xl font-serif text-yellow-500 font-bold cursor-pointer" onClick={() => navigate('/')}>
                            Mazoy
                        </div>
                        <nav className="hidden md:flex items-center space-x-8">
                            <a href="/#home" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Home</a>
                            <a href="/#eventos" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Eventos</a>
                            <a href="/#categorias" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Categorias</a>
                            <a href="/#contato" className="text-white hover:text-yellow-500 transition-colors duration-300 cursor-pointer">Contato</a>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative hidden lg:block">
                            <Input 
                                type="search" 
                                placeholder="Buscar eventos..." 
                                className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 w-64 pl-4 pr-10 py-2 rounded-xl"
                            />
                            <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-yellow-500/60"></i>
                        </div>
                        <AuthStatusMenu />
                    </div>
                </div>
            </header>
            <main className="pt-24 pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-serif text-yellow-500 mb-8">Meu Perfil</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                            <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-white text-2xl">Informações Pessoais</CardTitle>
                                    <CardDescription className="text-gray-400">Atualize seus dados pessoais aqui.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {session?.user?.id && (
                                        <div className="mb-8">
                                            <AvatarUpload
                                                userId={session.user.id}
                                                url={profile?.avatar_url || null}
                                                onUpload={handleAvatarUpload}
                                                initials={initials}
                                            />
                                        </div>
                                    )}
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="first_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">Nome</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Seu nome" {...field} disabled={!isEditing} className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 disabled:text-gray-400 disabled:cursor-not-allowed" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormItem>
                                                <FormLabel className="text-white">E-mail</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        value={session?.user?.email || ''} 
                                                        disabled 
                                                        className="bg-black/60 border-yellow-500/30 text-gray-400 cursor-not-allowed" 
                                                    />
                                                </FormControl>
                                            </FormItem>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormItem>
                                                    <FormLabel className="text-white">CPF</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            value={profile?.cpf ? formatCPF(profile.cpf) : ''} 
                                                            disabled 
                                                            className="bg-black/60 border-yellow-500/30 text-gray-400 cursor-not-allowed" 
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                                <FormItem>
                                                    <FormLabel className="text-white">RG</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            value={profile?.rg ? formatRG(profile.rg) : ''} 
                                                            disabled 
                                                            className="bg-black/60 border-yellow-500/30 text-gray-400 cursor-not-allowed" 
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="birth_date"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-white">Data de Nascimento</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    type="date" 
                                                                    {...field} 
                                                                    disabled={!isEditing} 
                                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 disabled:text-gray-400 disabled:cursor-not-allowed" 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="gender"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-white">Gênero</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                                                                <FormControl>
                                                                    <SelectTrigger 
                                                                        className="w-full bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                    >
                                                                        <SelectValue placeholder="Selecione seu gênero" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent className="bg-black border-yellow-500/30 text-white">
                                                                    {GENDER_OPTIONS.map(option => (
                                                                        <SelectItem key={option} value={option} className="hover:bg-yellow-500/10 cursor-pointer">
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            
                                            {isEditing ? (
                                                <div className="flex items-center space-x-4 pt-4">
                                                    <Button type="submit" disabled={formLoading} className="bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer">
                                                        {formLoading ? 'Salvando...' : 'Salvar Alterações'}
                                                    </Button>
                                                    <Button type="button" variant="outline" onClick={handleCancelEdit} className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10">
                                                        Cancelar
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button type="button" onClick={() => setIsEditing(true)} className="bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer">
                                                    Editar Perfil
                                                </Button>
                                            )}
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="md:col-span-1">
                             <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-white text-2xl">Meus Ingressos</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center p-6">
                                    <i className="fas fa-ticket-alt text-4xl text-yellow-500 mb-4"></i>
                                    <p className="text-gray-400 mb-4">
                                        Visualize e gerencie todos os seus ingressos comprados.
                                    </p>
                                    <Button 
                                        onClick={() => navigate('/tickets')}
                                        className="w-full bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer"
                                    >
                                        Ver Meus Ingressos
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;