import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2 } from 'lucide-react';
import { useManagerEvents, ManagerEvent } from '@/hooks/use-manager-events';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const ManagerEventsList: React.FC = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id);
        });
    }, []);

    const { events, isLoading, isError } = useManagerEvents(userId);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Simulação de dados de métricas (já que não temos a tabela de tickets)
    const getSimulatedMetrics = (event: ManagerEvent) => {
        // Adicionando verificação de segurança para garantir que o ID exista e seja uma string
        if (!event || typeof event.id !== 'string' || event.id.length === 0) {
            return { ticketsSold: 0, totalRevenue: 0 };
        }
        
        // Em um ambiente real, isso viria de um JOIN ou RPC
        const seed = event.id.charCodeAt(0) + event.id.charCodeAt(event.id.length - 1);
        const ticketsSold = 100 + (seed % 500);
        const totalRevenue = ticketsSold * (event.price || 100);
        return {
            ticketsSold: ticketsSold,
            totalRevenue: totalRevenue,
        };
    };

    if (isError) {
        return <div className="text-red-400 text-center py-10">Erro ao carregar eventos. Tente recarregar a página.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 mb-4 sm:mb-0">Meus Eventos ({events.length})</h1>
                <Button 
                    onClick={() => navigate('/manager/events/create')}
                    className="bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-base font-semibold transition-all duration-300 cursor-pointer"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Cadastrar Novo Evento
                </Button>
            </div>

            <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                <div className="relative mb-6">
                    <Input 
                        type="search" 
                        placeholder="Pesquisar por nome do evento..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 w-full pl-10 py-3 rounded-xl"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500/60" />
                </div>

                {isLoading ? (
                    <div className="text-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
                        <p className="text-gray-400">Carregando seus eventos...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center py-10">
                        <i className="fas fa-calendar-times text-5xl text-gray-600 mb-4"></i>
                        <p className="text-gray-400 text-lg">Nenhum evento encontrado.</p>
                        <p className="text-gray-500 text-sm mt-2">Comece criando seu primeiro evento premium!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="w-full min-w-[800px]">
                            <TableHeader>
                                <TableRow className="border-b border-yellow-500/20 text-sm hover:bg-black/40">
                                    <TableHead className="text-left text-gray-400 font-semibold py-3 w-[40%]">Evento</TableHead>
                                    <TableHead className="text-center text-gray-400 font-semibold py-3">Data</TableHead>
                                    <TableHead className="text-center text-gray-400 font-semibold py-3">Ingressos Vendidos</TableHead>
                                    <TableHead className="text-center text-gray-400 font-semibold py-3">Receita Total</TableHead>
                                    <TableHead className="text-center text-gray-400 font-semibold py-3">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEvents.map((event) => {
                                    // Passamos o objeto event inteiro para a função de métricas
                                    const metrics = getSimulatedMetrics(event);
                                    const formattedDate = new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                                    
                                    return (
                                        <TableRow key={event.id} className="border-b border-yellow-500/10 hover:bg-black/40 transition-colors text-sm cursor-pointer">
                                            <TableCell className="py-4">
                                                <div className="text-white font-medium truncate max-w-[300px]">{event.title}</div>
                                                <div className="text-gray-500 text-xs mt-1">ID: {event.id.substring(0, 8)}...</div>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <span className="text-white">{formattedDate}</span>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <span className="text-yellow-500 font-semibold">{metrics.ticketsSold.toLocaleString()}</span>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <span className="text-green-400 font-bold">R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 h-8 px-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Implementar navegação para edição
                                                        showSuccess(`Abrindo edição para: ${event.title}`);
                                                    }}
                                                >
                                                    <i className="fas fa-edit mr-2"></i>
                                                    Gerenciar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ManagerEventsList;