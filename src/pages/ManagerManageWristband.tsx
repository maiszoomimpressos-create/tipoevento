import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, QrCode, Tag, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw, Search } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Tipos de dados para a pulseira e analytics
interface WristbandDetails {
    id: string;
    code: string;
    access_type: string;
    status: 'active' | 'used' | 'lost' | 'cancelled';
    created_at: string;
    manager_user_id: string;
    events: { title: string } | null;
    company_id: string;
}

interface AnalyticsEntry {
    id: string;
    event_type: string;
    event_data: any;
    created_at: string;
    code_wristbands: string; // Adicionado para clareza, embora já estivesse na query
}

const STATUS_OPTIONS = [
    { value: 'active', label: 'Ativa', icon: CheckCircle, color: 'text-green-500' },
    { value: 'used', label: 'Utilizada', icon: XCircle, color: 'text-gray-500' },
    { value: 'lost', label: 'Perdida', icon: AlertTriangle, color: 'text-red-500' },
    { value: 'cancelled', label: 'Cancelada', icon: XCircle, color: 'text-red-500' },
];

// Hook para buscar detalhes da pulseira e analytics
const fetchWristbandData = async (id: string): Promise<{ details: WristbandDetails, analytics: AnalyticsEntry[] }> => {
    // 1. Buscar detalhes da pulseira
    const { data: detailsData, error: detailsError } = await supabase
        .from('wristbands')
        .select(`
            id, code, access_type, status, created_at, manager_user_id, company_id,
            events (title)
        `)
        .eq('id', id)
        .single();

    if (detailsError) throw detailsError;

    // 2. Buscar histórico de analytics
    const { data: analyticsData, error: analyticsError } = await supabase
        .from('wristband_analytics')
        .select('*')
        .eq('wristband_id', id)
        .order('created_at', { ascending: false });

    if (analyticsError) throw analyticsError;

    return {
        details: detailsData as WristbandDetails,
        analytics: analyticsData as AnalyticsEntry[],
    };
};

const useWristbandManagement = (id: string | undefined) => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ['wristbandManagement', id],
        queryFn: () => fetchWristbandData(id!),
        enabled: !!id,
        staleTime: 1000 * 10, // Manter dados frescos por 10 segundos
        onError: (error) => {
            console.error("Query Error:", error);
            showError("Erro ao carregar dados da pulseira.");
        }
    });

    return {
        ...query,
        invalidate: () => queryClient.invalidateQueries({ queryKey: ['wristbandManagement', id] }),
    };
};


const ManagerManageWristband: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { data, isLoading, isError, invalidate } = useWristbandManagement(id);
    const [newStatus, setNewStatus] = useState<WristbandDetails['status'] | string>('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Novo estado para pesquisa

    useEffect(() => {
        if (data?.details) {
            setNewStatus(data.details.status);
        }
    }, [data]);

    const handleStatusUpdate = async () => {
        if (!id || !newStatus) return;
        
        const statusChanged = newStatus !== data?.details.status;

        if (!statusChanged) {
            showError("Nenhuma alteração detectada. Selecione um novo status.");
            return;
        }
        
        setIsUpdatingStatus(true);
        const toastId = showLoading("Gravando alterações...");

        try {
            // 1. Atualizar Status
            const { error } = await supabase
                .from('wristbands')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // 2. Inserir registro de analytics para a mudança de status
            await supabase
                .from('wristband_analytics')
                .insert([{
                    wristband_id: id,
                    event_type: 'status_change',
                    code_wristbands: data?.details.code,
                    event_data: { 
                        old_status: data?.details.status, 
                        new_status: newStatus,
                        manager_id: data?.details.manager_user_id,
                        location: 'Gerenciamento Manual'
                    }
                }]);

            dismissToast(toastId);
            showSuccess("Status da pulseira atualizado com sucesso!");
            invalidate(); // Recarrega os dados

        } catch (e: any) {
            dismissToast(toastId);
            console.error("Update error:", e);
            showError(`Falha ao gravar alterações: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setIsUpdatingStatus(false);
        }
    };
    
    // Função auxiliar para obter o status do evento de analytics
    const getAnalyticsStatus = (entry: AnalyticsEntry) => {
        if (entry.event_type === 'status_change') {
            return entry.event_data.new_status;
        }
        if (entry.event_type === 'creation') {
            return entry.event_data.initial_status;
        }
        // Para outros eventos (ex: entrada/saída), o status é o status atual da pulseira
        return data?.details.status || 'N/A';
    };

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400';
            case 'used': return 'bg-gray-500/20 text-gray-400';
            case 'lost': return 'bg-red-500/20 text-red-400';
            case 'cancelled': return 'bg-red-500/20 text-red-400';
            default: return 'bg-yellow-500/20 text-yellow-400';
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando detalhes da pulseira...</p>
            </div>
        );
    }

    if (isError || !data?.details) {
        return (
            <div className="max-w-7xl mx-auto text-center py-20">
                <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                <p className="text-red-400">Pulseira não encontrada ou erro de carregamento.</p>
                <Button onClick={() => navigate('/manager/wristbands')} className="mt-4 bg-yellow-500 text-black hover:bg-yellow-600">
                    Voltar para a Lista
                </Button>
            </div>
        );
    }

    const { details, analytics } = data;
    const currentStatusOption = STATUS_OPTIONS.find(opt => opt.value === details.status);
    
    // Filtragem dos analytics
    const filteredAnalytics = analytics.filter(entry => 
        entry.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.code_wristbands?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(entry.event_data).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 flex items-center">
                    <QrCode className="h-7 w-7 mr-3" />
                    Gerenciar Pulseira: <span className="ml-2 text-white">{details.code}</span>
                </h1>
                <Button 
                    onClick={() => navigate('/manager/wristbands')}
                    variant="outline"
                    className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para a Lista
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna de Detalhes e Status (CONSOLIDADA) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardTitle className="text-white text-xl mb-4 flex items-center">
                            <Tag className="h-5 w-5 mr-2 text-yellow-500" />
                            Informações e Status
                        </CardTitle>
                        
                        {/* Informações Básicas (Espaçamento reduzido) */}
                        <div className="space-y-2 text-sm pb-4 border-b border-yellow-500/10 mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Evento:</span>
                                <span className="text-white font-medium truncate max-w-[150px]">{details.events?.title || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Tipo de Acesso:</span>
                                <span className="text-yellow-500 font-medium">{details.access_type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Criação:</span>
                                <span className="text-gray-300">{new Date(details.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Cadastrado por:</span>
                                <span className="text-gray-300 truncate max-w-[150px]">{details.manager_user_id.substring(0, 8)}...</span>
                            </div>
                        </div>

                        {/* Gerenciamento de Status (Integrado) */}
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm flex items-center">
                                    <RefreshCw className="h-4 w-4 mr-2 text-yellow-500" />
                                    Status Atual:
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentStatusOption?.color} bg-yellow-500/10`}>
                                    {currentStatusOption?.label}
                                </span>
                            </div>
                            
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-white mb-2">Alterar Status</label>
                                <Select onValueChange={setNewStatus} value={newStatus}>
                                    <SelectTrigger className="w-full bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500 h-10">
                                        <SelectValue placeholder="Selecione o novo status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border-yellow-500/30 text-white">
                                        {STATUS_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value} className="hover:bg-yellow-500/10 cursor-pointer">
                                                <div className="flex items-center">
                                                    <option.icon className={`h-4 w-4 mr-2 ${option.color}`} />
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Button
                                onClick={handleStatusUpdate}
                                disabled={isUpdatingStatus || !newStatus || newStatus === details.status}
                                className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-2 text-base font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 h-10"
                            >
                                {isUpdatingStatus ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Salvar Status'
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Coluna de Histórico de Analytics (Grid/Tabela) */}
                <div className="lg:col-span-2">
                    <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardTitle className="text-white text-xl mb-4 flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                            Histórico de Uso (Analytics)
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-sm mb-4">
                            Rastreamento de entradas, saídas e mudanças de status.
                        </CardDescription>
                        
                        {/* Campo de Pesquisa */}
                        <div className="relative mb-6">
                            <Input 
                                type="search" 
                                placeholder="Pesquisar por código da pulseira ou tipo de evento..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 w-full pl-10 py-3 rounded-xl"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-500/60" />
                        </div>

                        <div className="max-h-[500px] overflow-y-auto">
                            {filteredAnalytics.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Nenhum registro encontrado.
                                </div>
                            ) : (
                                <Table className="w-full min-w-[600px]">
                                    <TableHeader>
                                        <TableRow className="border-b border-yellow-500/20 text-sm hover:bg-black/40">
                                            <TableHead className="text-left text-gray-400 font-semibold py-3 w-[25%]">Evento</TableHead>
                                            <TableHead className="text-left text-gray-400 font-semibold py-3 w-[25%]">Código Pulseira</TableHead>
                                            <TableHead className="text-center text-gray-400 font-semibold py-3 w-[20%]">Status</TableHead>
                                            <TableHead className="text-right text-gray-400 font-semibold py-3 w-[30%]">Data/Hora</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAnalytics.map((entry) => {
                                            const eventTitle = details.events?.title || 'N/A';
                                            const wristbandCode = entry.code_wristbands || details.code;
                                            const status = getAnalyticsStatus(entry);
                                            const statusClasses = getStatusClasses(status);

                                            return (
                                                <TableRow 
                                                    key={entry.id} 
                                                    className="border-b border-yellow-500/10 hover:bg-black/40 transition-colors text-sm"
                                                >
                                                    <TableCell className="py-3 text-white font-medium truncate max-w-[150px]">
                                                        {eventTitle}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-yellow-500 font-medium">
                                                        {wristbandCode}
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses}`}>
                                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right text-gray-500 text-xs">
                                                        {new Date(entry.created_at).toLocaleString('pt-BR')}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ManagerManageWristband;