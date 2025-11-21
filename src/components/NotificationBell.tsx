import React from 'react';
import { Bell, User } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
    hasPendingNotifications: boolean;
    loading: boolean;
    missingFields: string[];
}

const NotificationBell: React.FC<NotificationBellProps> = ({ hasPendingNotifications, loading, missingFields }) => {
    const navigate = useNavigate();

    if (loading) {
        return <div className="w-8 h-8 bg-yellow-500/20 rounded-full animate-pulse"></div>;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button 
                    className="relative p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors cursor-pointer"
                    title={hasPendingNotifications ? "Perfil Incompleto" : "Nenhuma notificação"}
                >
                    <i className="fas fa-bell text-lg"></i>
                    {hasPendingNotifications && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-black/90 border border-yellow-500/30 text-white p-0">
                <div className="p-4 border-b border-yellow-500/20">
                    <h4 className="text-lg font-semibold text-yellow-500">Notificações</h4>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto">
                    {hasPendingNotifications ? (
                        <div className="space-y-3">
                            <div className="flex items-start p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <User className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                                <div className="ml-3">
                                    <p className="text-white font-medium text-sm">Perfil Incompleto</p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Para aproveitar todas as funcionalidades, por favor, preencha os seguintes campos:
                                    </p>
                                    <ul className="list-disc list-inside text-yellow-500 text-xs mt-2 space-y-1">
                                        {missingFields.map(field => <li key={field}>{field}</li>)}
                                    </ul>
                                    <Button 
                                        variant="link" 
                                        className="h-auto p-0 mt-2 text-xs text-yellow-500 hover:text-yellow-400"
                                        onClick={() => navigate('/profile')}
                                    >
                                        Ir para o Perfil
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Bell className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Nenhuma notificação pendente.</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;