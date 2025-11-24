import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, Loader2, Crown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { useUserType } from '@/hooks/use-user-type';
import { showError } from '@/utils/toast';

const ADMIN_USER_TYPE_ID = 1;
const MANAGER_USER_TYPE_ID = 2;

const ManagerLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [loadingSession, setLoadingSession] = useState(true);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id);
            setLoadingSession(false);
        });
    }, []);

    const { profile, isLoading: isLoadingProfile } = useProfile(userId);
    const { userTypeName, isLoadingUserType } = useUserType(profile?.tipo_usuario_id);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            showError("Erro ao sair: " + error.message);
        } else {
            navigate('/');
        }
    };

    // Redirect unauthenticated users to login
    if (loadingSession || isLoadingProfile || isLoadingUserType) {
        if (!userId && !loadingSession) {
            // Only redirect if trying to access a manager/admin route
            if (location.pathname.startsWith('/manager') || location.pathname.startsWith('/admin')) {
                navigate('/manager/login');
            }
            return (
                <div className="min-h-screen bg-black text-white flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
                </div>
            );
        }
        // If loading, show spinner
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
            </div>
        );
    }
    
    // Check if user is authorized (Admin or Manager)
    const userType = profile?.tipo_usuario_id;
    const isManager = userType === ADMIN_USER_TYPE_ID || userType === MANAGER_USER_TYPE_ID;
    const isAdminMaster = userType === ADMIN_USER_TYPE_ID;

    if (!isManager) {
        // If the user is logged in but not a manager/admin (e.g., client type 3), redirect them
        if (location.pathname.startsWith('/manager') || location.pathname.startsWith('/admin')) {
            navigate('/');
            return null;
        }
    }
    
    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/manager/dashboard', label: 'Dashboard PRO' },
        { path: '/manager/events', label: 'Eventos' },
        { path: '/manager/wristbands', label: 'Pulseiras' },
        { path: '/manager/reports', label: 'Relatórios' },
        { path: '/manager/settings', label: 'Configurações' },
    ];
    
    // Add Admin Dashboard link if the user is an Admin Master
    if (isAdminMaster) {
        navItems.splice(1, 0, { path: '/admin/dashboard', label: 'Dashboard Admin' });
    }
    
    const dashboardTitle = isAdminMaster && location.pathname.startsWith('/admin') ? 'ADMIN' : 'PRO';
    
    let userRole = 'Usuário Desconhecido';
    if (userType === ADMIN_USER_TYPE_ID) {
        userRole = 'Administrador Master';
    } else if (userType === MANAGER_USER_TYPE_ID) {
        userRole = 'Administrador PRO';
    } else if (userType === 3) {
        userRole = 'Cliente';
    }
    
    const userName = profile?.first_name || 'Gestor';
    const userRole = userTypeName;


    const NavLinks: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
        <nav className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0">
            {navItems.map(item => {
                // Determine if the link is active based on the current path
                let isActive = false;
                
                if (item.path === '/') {
                    // Home is active only if the path is exactly '/'
                    isActive = location.pathname === '/';
                } else if (item.path !== '#') {
                    // Other paths are active if the current path starts with them
                    isActive = location.pathname.startsWith(item.path);
                }
                
                // Special handling for Dashboard links to ensure only one is highlighted
                const isManagerDashboardActive = location.pathname === '/manager/dashboard' && item.path === '/manager/dashboard';
                const isAdminDashboardActive = location.pathname === '/admin/dashboard' && item.path === '/admin/dashboard';
                
                const isLinkActive = isActive || isManagerDashboardActive || isAdminDashboardActive;

                return (
                    <button 
                        key={item.path}
                        onClick={() => {
                            if (item.path !== '#') navigate(item.path);
                            if (onClick) onClick();
                        }} 
                        className={`transition-colors duration-300 cursor-pointer py-2 md:py-0 md:pb-1 text-left ${
                            isLinkActive
                            ? 'text-yellow-500 md:border-b-2 border-yellow-500 font-semibold' 
                            : 'text-white hover:text-yellow-500'
                        }`}
                    >
                        {item.label}
                    </button>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="fixed top-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-md border-b border-yellow-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 sm:space-x-6">
                        <div className="text-xl sm:text-2xl font-serif text-yellow-500 font-bold flex items-center">
                            Mazoy
                            <span className="ml-2 sm:ml-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-2 sm:px-3 py-0.5 rounded-lg text-xs sm:text-sm font-bold">{dashboardTitle}</span>
                        </div>
                        <div className="hidden md:block">
                            <NavLinks />
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <button className="relative p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors cursor-pointer hidden sm:block">
                            <i className="fas fa-bell text-lg"></i>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">3</span>
                        </button>
                        <div className="flex items-center space-x-3 hidden sm:flex">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-sm">
                                <Crown className="h-5 w-5" />
                            </div>
                            <div className="text-right hidden lg:block">
                                <div className="text-white font-semibold text-sm">{userName}</div>
                                <div className="text-gray-400 text-xs">{userRole}</div>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            className="bg-transparent border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition-all duration-300 cursor-pointer px-3 py-1 h-8 text-sm hidden sm:block"
                        >
                            Sair
                        </Button>

                        {/* Mobile Menu Trigger */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden text-yellow-500 hover:bg-yellow-500/10">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[250px] bg-black/95 border-l border-yellow-500/30 text-white p-0">
                                <SheetHeader className="p-4 border-b border-yellow-500/20">
                                    <SheetTitle className="text-2xl font-serif text-yellow-500">Mazoy {dashboardTitle}</SheetTitle>
                                </SheetHeader>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                                            <Crown className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">{userName}</div>
                                            <div className="text-gray-400 text-sm">{userRole}</div>
                                        </div>
                                    </div>
                                    <NavLinks onClick={() => {}} />
                                    <div className="border-t border-yellow-500/20 pt-4">
                                        <Button
                                            onClick={handleLogout}
                                            className="w-full justify-start bg-transparent border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition-all duration-300 cursor-pointer"
                                        >
                                            <i className="fas fa-sign-out-alt mr-2"></i>
                                            Sair
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
            <main className="pt-20 p-4 sm:p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default ManagerLayout;