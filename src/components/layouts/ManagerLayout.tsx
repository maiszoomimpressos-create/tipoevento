import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const ManagerLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/manager/dashboard', label: 'Dashboard' },
        { path: '/manager/events', label: 'Eventos' },
        { path: '/manager/wristbands', label: 'Pulseiras' }, // Rota atualizada para a lista
        { path: '#', label: 'Relatórios' },
        { path: '/manager/settings', label: 'Configurações' },
    ];

    const NavLinks: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
        <nav className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0">
            {navItems.map(item => (
                <button 
                    key={item.path}
                    onClick={() => {
                        if (item.path !== '#') navigate(item.path);
                        if (onClick) onClick();
                    }} 
                    className={`transition-colors duration-300 cursor-pointer py-2 md:py-0 md:pb-1 text-left ${
                        location.pathname.startsWith(item.path) && item.path !== '#'
                        ? 'text-yellow-500 md:border-b-2 border-yellow-500 font-semibold' 
                        : 'text-white hover:text-yellow-500'
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="fixed top-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-md border-b border-yellow-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 sm:space-x-6">
                        <div className="text-xl sm:text-2xl font-serif text-yellow-500 font-bold flex items-center">
                            Mazoy
                            <span className="ml-2 sm:ml-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-2 sm:px-3 py-0.5 rounded-lg text-xs sm:text-sm font-bold">PRO</span>
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
                                <i className="fas fa-user-tie"></i>
                            </div>
                            <div className="text-right hidden lg:block">
                                <div className="text-white font-semibold text-sm">João Manager</div>
                                <div className="text-gray-400 text-xs">Administrador PRO</div>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/')}
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
                                    <SheetTitle className="text-2xl font-serif text-yellow-500">Mazoy PRO</SheetTitle>
                                </SheetHeader>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">
                                            <i className="fas fa-user-tie"></i>
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">João Manager</div>
                                            <div className="text-gray-400 text-sm">Administrador PRO</div>
                                        </div>
                                    </div>
                                    <NavLinks onClick={() => {}} />
                                    <div className="border-t border-yellow-500/20 pt-4">
                                        <Button
                                            onClick={() => navigate('/')}
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