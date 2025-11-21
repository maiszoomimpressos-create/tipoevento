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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { showSuccess, showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import AuthStatusMenu from '@/components/AuthStatusMenu';

const profileSchema = z.object({
    first_name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
});

interface ProfileData {
    first_name: string;
    avatar_url: string | null;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: '',
        },
    });

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
                .select('first_name, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (error) {
                showError("Não foi possível carregar seu perfil.");
                console.error(error);
            } else if (data) {
                setProfile(data);
                form.reset({ first_name: data.first_name || '' });
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
            .update({ first_name: values.first_name })
            .eq('id', session.user.id);

        if (error) {
            showError("Erro ao atualizar o perfil.");
        } else {
            showSuccess("Perfil atualizado com sucesso!");
            setProfile(prev => prev ? { ...prev, first_name: values.first_name } : null);
        }
        setFormLoading(false);
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
                                    <div className="flex items-center space-x-6 mb-8">
                                        <Avatar className="h-24 w-24 border-2 border-yellow-500/50">
                                            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name} />
                                            <AvatarFallback className="bg-yellow-500 text-black font-bold text-4xl">{initials}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{profile?.first_name}</h2>
                                            <p className="text-gray-400">{session?.user?.email}</p>
                                            <Button variant="outline" className="mt-2 bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm h-8">
                                                Alterar Foto
                                            </Button>
                                        </div>
                                    </div>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="first_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">Nome</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Seu nome" {...field} className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" disabled={formLoading} className="bg-yellow-500 text-black hover:bg-yellow-600 transition-all duration-300 cursor-pointer">
                                                {formLoading ? 'Salvando...' : 'Salvar Alterações'}
                                            </Button>
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
                                <CardContent className="text-center text-gray-400">
                                    <i className="fas fa-ticket-alt text-4xl text-yellow-500 mb-4"></i>
                                    <p>Você ainda não possui ingressos para eventos futuros.</p>
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