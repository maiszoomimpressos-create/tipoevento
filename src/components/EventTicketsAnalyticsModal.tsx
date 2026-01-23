import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User, Mail, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useEventTicketAnalytics } from '@/hooks/use-event-ticket-analytics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventTicketsAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventName: string;
}

const EventTicketsAnalyticsModal: React.FC<EventTicketsAnalyticsModalProps> = ({
    isOpen, onClose, eventId, eventName
}) => {
    const { data: tickets, isLoading, isError } = useEventTicketAnalytics(eventId);

    const soldTickets = tickets?.filter(ticket => ticket.status === 'used') || [];
    const unsoldTickets = tickets?.filter(ticket => ticket.status === 'active') || [];

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Data Inválida';
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-black border border-yellow-500/30 text-white p-6">
                <DialogHeader>
                    <DialogTitle className="text-yellow-500 text-2xl">Análise de Ingressos: {eventName}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Visualize o status de todos os ingressos do evento, incluindo detalhes dos compradores para ingressos vendidos.
                    </DialogDescription>
                </DialogHeader>
                <Separator className="my-4 bg-yellow-500/30" />

                {isLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mr-3" />
                        <p className="text-gray-400">Carregando análise de ingressos...</p>
                    </div>
                )}

                {isError && (
                    <div className="flex items-center justify-center py-10 text-red-500">
                        <XCircle className="h-8 w-8 mr-3" />
                        <p>Erro ao carregar detalhes dos ingressos. Tente novamente.</p>
                    </div>
                )}

                {!isLoading && !isError && tickets && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-green-400 mb-3 flex items-center">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Ingressos Vendidos ({soldTickets.length})
                            </h3>
                            {soldTickets.length === 0 ? (
                                <p className="text-gray-400 ml-7">Nenhum ingresso vendido ainda.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-yellow-500/30">
                                                <TableHead className="text-yellow-500">Código</TableHead>
                                                <TableHead className="text-yellow-500">Tipo Acesso</TableHead>
                                                <TableHead className="text-yellow-500">Preço</TableHead>
                                                <TableHead className="text-yellow-500">Comprador</TableHead>
                                                <TableHead className="text-yellow-500">Email</TableHead>
                                                <TableHead className="text-yellow-500">Data Compra</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {soldTickets.map(ticket => (
                                                <TableRow key={ticket.id} className="border-yellow-500/10 hover:bg-yellow-500/5">
                                                    <TableCell className="font-medium text-white">{ticket.code}</TableCell>
                                                    <TableCell className="text-gray-400">{ticket.access_type}</TableCell>
                                                    <TableCell className="text-green-400">{formatCurrency(ticket.price)}</TableCell>
                                                    <TableCell className="text-white flex items-center">
                                                        <User className="h-4 w-4 mr-2 text-yellow-500" />
                                                        {ticket.analytics?.profiles?.full_name || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-gray-400 flex items-center">
                                                        <Mail className="h-4 w-4 mr-2 text-yellow-500" />
                                                        {ticket.analytics?.profiles?.email || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-gray-400 flex items-center">
                                                        <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
                                                        {formatDate(ticket.analytics?.event_data?.purchase_date)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                        <Separator className="my-4 bg-yellow-500/30" />

                        <div>
                            <h3 className="text-xl font-semibold text-red-400 mb-3 flex items-center">
                                <XCircle className="h-5 w-5 mr-2" />
                                Ingressos Não Vendidos ({unsoldTickets.length})
                            </h3>
                            {unsoldTickets.length === 0 ? (
                                <p className="text-gray-400 ml-7">Todos os ingressos foram vendidos!</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-yellow-500/30">
                                                <TableHead className="text-yellow-500">Código</TableHead>
                                                <TableHead className="text-yellow-500">Tipo Acesso</TableHead>
                                                <TableHead className="text-yellow-500">Preço</TableHead>
                                                <TableHead className="text-yellow-500">Status</TableHead>
                                                <TableHead className="text-yellow-500">Criado Em</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {unsoldTickets.map(ticket => (
                                                <TableRow key={ticket.id} className="border-yellow-500/10 hover:bg-yellow-500/5">
                                                    <TableCell className="font-medium text-white">{ticket.code}</TableCell>
                                                    <TableCell className="text-gray-400">{ticket.access_type}</TableCell>
                                                    <TableCell className="text-red-400">{formatCurrency(ticket.price)}</TableCell>
                                                    <TableCell className="text-red-400">Não Vendido</TableCell>
                                                    <TableCell className="text-gray-400">{formatDate(ticket.created_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default EventTicketsAnalyticsModal;

