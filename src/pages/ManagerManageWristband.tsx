import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // Importando Input
import { ArrowLeft, Loader2, QrCode, Tag, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
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
    
    // Estado para a quantidade de uso (reintroduzido)
    const [usageQuantity, setUsageQuantity] = useState<number>(1);

    useEffect(() => {
        if (data?.details) {
            setNewStatus(data.details.status);
        }
    }, [data]);

    const handleStatusUpdate = async () => {
        if (!id || !newStatus) return;
        
        const statusChanged = newStatus !== data?.details.status;
        const quantityUsed = usageQuantity > 0;

        if (!statusChanged && !quantityUsed) {
            showError("Nenhuma alteração detectada. Altere o status ou a quantidade de uso.");
            return;
        }
        
        if (quantityUsed && data?.details.status !== 'active') {
            showError("Não é possível registrar uso em pulseiras inativas.");
            return;
        }

        setIsUpdatingStatus(true);
        const toastId = showLoading("Gravando alterações...");

        try {
            // 1. Atualizar Status (se mudou)
            if (statusChanged) {
                const { error } = await supabase
                    .from('wristbands')
                    .update({ status: newStatus })
                    .eq('id', id);

                if (error) throw error;
            }

            // 2. Inserir registro de analytics (se status mudou OU quantidade foi registrada)
            if (statusChanged || quantityUsed) {
                const eventType = statusChanged ? 'status_change' : 'usage_entry';
                
                await supabase
                    .from('wristband_analytics')
                    .insert([{
                        wristband_id: id,
                        event_type: eventType,
                        event_data: { 
                            old_status: statusChanged ? data?.details.status : undefined, 
                            new_status: statusChanged ? newStatus : undefined,
                            quantity: quantityUsed ? usageQuantity : undefined,
                            manager_id: data?.details.manager_user_id,
                            location: 'Gerenciamento Manual'
                        }
                    }]);
            }

            dismissToast(toastId);
            showSuccess("Alterações gravadas com sucesso!");
            setUsageQuantity(1); // Resetar quantidade após uso
            invalidate(); // Recarrega os dados

        } catch (e: any) {
            dismissToast(toastId);
            console.error("Update error:", e);
            showError(`Falha ao gravar alterações: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setIsUpdatingStatus(false);
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
                {/* Coluna de Detalhes e Status */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardTitle className="text-white text-xl mb-4 flex items-center">
                            <Tag className="h-5 w-5 mr-2 text-yellow-500" />
                            Informações Básicas
                        </CardTitle>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-yellow-500/10 pb-2">
                                <span className="text-gray-400">Evento:</span>
                                <span className="text-white font-medium">{details.events?.title || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-yellow-500/10 pb-2">
                                <span className="text-gray-400">Tipo de Acesso:</span>
                                <span className="text-yellow-500 font-medium">{details.access_type}</span>
                            </div>
                            <div className="flex justify-between border-b border-yellow-500/10 pb-2">
                                <span className="text-gray-400">Data de Criação:</span>
                                <span className="text-gray-300">{new Date(details.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Cadastrado por:</span>
                                <span className="text-gray-300 truncate max-w-[150px]">{details.manager_user_id.substring(0, 8)}...</span>
                            </div>
                        </div>
                    </Card>

                    {/* Gerenciamento de Status e Uso */}
                    <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardTitle className="text-white text-xl mb-4 flex items-center">
                            <RefreshCw className="h-5 w-5 mr-2 text-yellow-500" />
                            Atualizar Status
                        </CardTitle>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Status Atual:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${currentStatusOption?.color} bg-yellow-500/10`}>
                                    {currentStatusOption?.label}
                                </span>
                            </div>
                            
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-white mb-2">Novo Status</label>
                                <Select onValueChange={setNewStatus} value={newStatus}>
                                    <SelectTrigger className="w-full bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500">
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
                            
                            {/* Campo Quantidade (reintroduzido) */}
                            <div>
                                <label htmlFor="usageQuantity" className="block text-sm font-medium text-white mb-2">Quantidade de Uso (Opcional)</label>
                                <Input 
                                    id="usageQuantity" 
                                    type="number"
                                    value={usageQuantity} 
                                    onChange={(e) => setUsageQuantity(Math.max(0, parseInt(e.target.value) || 0))} 
                                    placeholder="1"
                                    className="bg-black/60 border-yellow-500/30 text-white focus:border-yellow-500"
                                    min={0}
                                />
                                <p className="text-xs text-gray-500 mt-1">Se maior que 0, registra um evento de uso no histórico.</p>
                            </div>

                            <div className="flex space-x-4 pt-2">
                                <Button
                                    onClick={handleStatusUpdate}
                                    disabled={isUpdatingStatus || !newStatus}
                                    className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                                >
                                    {isUpdatingStatus ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        'Gravar Alterações'
                                    )}
                                </Button>
                                <Button
                                    onClick={() => navigate('/manager/wristbands/create')}
                                    variant="outline"
                                    className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                                    disabled={isUpdatingStatus}
                                    title="Voltar para a tela de cadastro de pulseiras"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Coluna de Histórico de Analytics */}
                <div className="lg:col-span-2">
                    <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardTitle className="text-white text-xl mb-4 flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                            Histórico de Uso (Analytics)
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-sm mb-4">
                            Rastreamento de entradas, saídas e mudanças de status.
                        </CardDescription>
                        
                        <div className="max-h-[500px] overflow-y-auto space-y-3">
                            {analytics.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Nenhum registro de uso encontrado para esta pulseira.
                                </div>
                            ) : (
                                analytics.map((entry) => (
                                    <div key={entry.id} className="p-3 bg-black/60 rounded-xl border border-yellow-500/10 flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                                            <div>
                                                <p className="text-white font-medium text-sm capitalize">
                                                    {entry.event_type.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-gray-400 text-xs mt-0.5">
                                                    {new Date(entry.created_at).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {entry.event_data && (
                                                <span className="text-gray-500 text-xs">
                                                    {entry.event_data.new_status ? `Status: ${entry.event_data.new_status}` : ''}
                                                    {entry.event_data.quantity ? ` | Qtd: ${entry.event_data.quantity}` : ''}
                                                    {entry.event_data.location ? ` | Local: ${entry.event_data.location}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ManagerManageWristband;