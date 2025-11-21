import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showSuccess, showError } from '@/utils/toast';

interface UserProfile {
    first_name: string;
    avatar_url: string | null;
    tipo_usuario_id: number;
}

const AuthStatusMenu: React.FC = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            if (currentSession) {
                fetchProfile(currentSession.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            if (initialSession) {
                fetchProfile(initialSession.user.id);
            } else {
                setLoading(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('first_name, avatar_url, tipo_usuario_id')
            .eq('id', userId)
            .single();

        if (error) {
            console.error("Error fetching profile:", error);
            setProfile(null);
            showError("Não foi possível carregar o perfil.");
        } else if (data) {
            setProfile(data);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showError("Erro ao sair: " + error.message);
        } else {
            showSuccess("Sessão encerrada com sucesso.");
            navigate('/');
        }
    };

    if (loading) {
        // Pode retornar um Skeleton ou null durante o carregamento inicial
        return <div className="w-10 h-10 bg-yellow-500/20 rounded-full animate-pulse"></div>;
    }

    if (session && profile) {
        const initials = profile.first_name ? profile.first_name.charAt(0).toUpperCase() : 'U';
        const isManager = profile.tipo_usuario_id === 1 || profile.tipo_usuario_id === 2;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="cursor-pointer p-1 rounded-full border-2 border-yellow-500/50 hover:border-yellow-500 transition-all duration-300">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name} />
                            <AvatarFallback className="bg-yellow-500 text-black font-bold text-sm">{initials}</AvatarFallback>
                        </Avatar>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-black/90 border border-yellow-500/30 text-white">
                    <DropdownMenuLabel className="text-yellow-500">
                        Olá, {profile.first_name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-yellow-500/20" />
                    <DropdownMenuItem 
                        onClick={() => navigate('/profile')} 
                        className="cursor-pointer hover:bg-yellow-500/10"
                    >
                        <i className="fas fa-user-circle mr-2"></i>
                        Editar Perfil
                    </DropdownMenuItem>
                    {isManager && (
                        <DropdownMenuItem 
                            onClick={() => navigate('/manager/dashboard')} 
                            className="cursor-pointer hover:bg-yellow-500/10 text-yellow-500 font-semibold"
                        >
                            <i className="fas fa-crown mr-2"></i>
                            Dashboard PRO
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-yellow-500/20" />
                    <DropdownMenuItem 
                        onClick={handleLogout} 
                        className="cursor-pointer hover:bg-red-500/10 text-red-400"
                    >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Sair
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // Se não estiver logado, retorna os botões de Login/Cadastro
    return (
        <div className="flex items-center space-x-3">
            <Button
                onClick={() => navigate('/login')}
                className="bg-transparent text-yellow-500 hover:bg-yellow-500/10 transition-all duration-300 cursor-pointer px-4"
            >
                Login
            </Button>
            <Button
                onClick={() => navigate('/register')}
                className="border border-yellow-500 bg-transparent text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-300 cursor-pointer px-4"
            >
                Cadastro
            </Button>
        </div>
    );
};

export default AuthStatusMenu;