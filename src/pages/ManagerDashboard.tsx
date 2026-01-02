import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { managerStats } from '@/data/events';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, QrCode, BarChart3, Download, Settings, ChevronDown } from 'lucide-react';

const ManagerDashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-white mb-2">Bem-vindo ao Dashboard PRO</h1>
                <p className="text-gray-400 text-sm sm:text-base">Gerencie seus eventos com ferramentas premium e analytics avançados</p>
            </div>

            {/* Cartões de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-black border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/60 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <i className="fas fa-chart-line text-green-500 text-lg sm:text-xl"></i>
                        </div>
                        <div className="text-right">
                            <div className="text-green-500 text-sm font-semibold">+{managerStats.monthlyGrowth}%</div>
                            <div className="text-gray-400 text-xs">vs mês anterior</div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold text-white mb-1">R$ {managerStats.totalSales.toLocaleString()}</div>
                        <div className="text-gray-400 text-sm">Vendas Totais</div>
                    </div>
                </div>

                <div className="bg-black border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/60 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                            <i className="fas fa-ticket-alt text-blue-500 text-lg sm:text-xl"></i>
                        </div>
                        <div className="text-right">
                            <div className="text-blue-500 text-sm font-semibold">+12.3%</div>
                            <div className="text-gray-400 text-xs">vs mês anterior</div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold text-white mb-1">{managerStats.totalTickets.toLocaleString()}</div>
                        <div className="text-gray-400 text-sm">Ingressos Vendidos</div>
                    </div>
                </div>

                <div className="bg-black border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/60 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <i className="fas fa-calendar-check text-yellow-500 text-lg sm:text-xl"></i>
                        </div>
                        <div className="text-right">
                            <div className="text-yellow-500 text-sm font-semibold">{managerStats.activeEvents}/{managerStats.totalEvents}</div>
                            <div className="text-gray-400 text-xs">ativos/total</div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold text-white mb-1">{managerStats.activeEvents}</div>
                        <div className="text-gray-400 text-sm">Eventos Ativos</div>
                    </div>
                </div>

                <div className="bg-black border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/60 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <i className="fas fa-users text-purple-500 text-lg sm:text-xl"></i>
                        </div>
                        <div className="text-right">
                            <div className="text-purple-500 text-sm font-semibold">Excelente</div>
                            <div className="text-gray-400 text-xs">performance</div>
                        </div>
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold text-white mb-1">87%</div>
                        <div className="text-gray-400 text-sm">Taxa de Ocupação</div>
                    </div>
                </div>
            </div>

            {/* Gráficos e Top Eventos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-black border border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-white">Receita Mensal</h3>
                        <div className="flex items-center space-x-4">
                            <select className="bg-black/60 border border-yellow-500/30 rounded-lg px-3 py-1 text-white text-sm focus:outline-none cursor-pointer">
                                <option>Últimos 6 meses</option>
                                <option>Último ano</option>
                            </select>
                        </div>
                    </div>
                    <div className="h-64 bg-black/40 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                            <i className="fas fa-chart-area text-yellow-500 text-4xl mb-4"></i>
                            <p className="text-gray-400">Gráfico de receita em desenvolvimento</p>
                            <p className="text-gray-500 text-sm">Analytics avançados em breve</p>
                        </div>
                    </div>
                </div>

                <div className="bg-black border border-yellow-500/30 rounded-2xl p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">Eventos Mais Vendidos</h3>
                    <div className="space-y-4">
                        {managerStats.topEvents.map((event, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-black/40 rounded-xl">
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-semibold mb-1 text-sm sm:text-base truncate">{event.name}</div>
                                    <div className="flex items-center space-x-4 text-xs sm:text-sm">
                                        <span className="text-gray-400 flex-shrink-0">{event.sold}/{event.total} vendidos</span>
                                        <div className="flex-1 bg-black/60 rounded-full h-2 max-w-[100px] hidden sm:block">
                                            <div
                                                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(event.sold / event.total) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <div className="text-yellow-500 font-semibold text-sm sm:text-base">R$ {event.revenue.toLocaleString()}</div>
                                    <div className="text-gray-400 text-xs">{Math.round((event.sold / event.total) * 100)}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Vendas Recentes e Ações Rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-black border border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-white">Vendas Recentes</h3>
                        <Button className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 text-xs sm:text-sm cursor-pointer px-3 py-1">
                            Ver Todas
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="border-b border-yellow-500/20 text-sm">
                                    <th className="text-left text-gray-400 font-semibold py-3">Evento</th>
                                    <th className="text-center text-gray-400 font-semibold py-3">Ingressos</th>
                                    <th className="text-center text-gray-400 font-semibold py-3">Valor</th>
                                    <th className="text-center text-gray-400 font-semibold py-3">Data</th>
                                    <th className="text-center text-gray-400 font-semibold py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managerStats.recentSales.map((sale) => (
                                    <tr key={sale.id} className="border-b border-yellow-500/10 hover:bg-black/40 transition-colors text-sm">
                                        <td className="py-4">
                                            <div className="text-white font-medium truncate max-w-[200px]">{sale.event}</div>
                                        </td>
                                        <td className="text-center py-4">
                                            <span className="text-white">{sale.tickets}</span>
                                        </td>
                                        <td className="text-center py-4">
                                            <span className="text-yellow-500 font-semibold">R$ {sale.value.toLocaleString()}</span>
                                        </td>
                                        <td className="text-center py-4">
                                            <span className="text-gray-400 text-xs">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                                        </td>
                                        <td className="text-center py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sale.status === 'Confirmado'
                                                    ? 'bg-green-500/20 text-green-500'
                                                    : 'bg-yellow-500/20 text-yellow-500'
                                                }`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-black border border-yellow-500/30 rounded-2xl p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-6">Ações Rápidas</h3>
                    
                    {/* Menu Suspenso de Ações Rápidas */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 transition-all duration-300 cursor-pointer flex items-center justify-center text-sm sm:text-base"
                            >
                                <Settings className="mr-2 h-5 w-5" />
                                Ações de Gerenciamento
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full bg-black/90 border border-yellow-500/30 text-white">
                            <DropdownMenuLabel className="text-yellow-500">Gerenciar Eventos e Pulseiras</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-yellow-500/20" />
                            <DropdownMenuItem 
                                onClick={() => navigate('/manager/events/create')}
                                className="cursor-pointer hover:bg-yellow-500/10"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Criar Novo Evento
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => navigate('/manager/wristbands/create')}
                                className="cursor-pointer hover:bg-yellow-500/10"
                            >
                                <QrCode className="mr-2 h-4 w-4" />
                                Gerar Pulseiras
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-yellow-500/20" />
                            <DropdownMenuItem 
                                onClick={() => navigate('/manager/reports')}
                                className="cursor-pointer hover:bg-yellow-500/10"
                            >
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Relatório Completo
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => alert('Exportando dados...')}
                                className="cursor-pointer hover:bg-yellow-500/10"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Exportar Dados
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Status do Sistema (mantido) */}
                    <div className="mt-8 p-4 bg-black/40 rounded-xl">
                        <h4 className="text-white font-semibold mb-4 flex items-center text-base sm:text-lg">
                            <i className="fas fa-server text-yellow-500 mr-2"></i>
                            Status do Sistema
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Vendas Online</span>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-green-500">Ativo</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Gateway Pagamento</span>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-green-500">Ativo</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Sistema Pulseiras</span>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-green-500">Ativo</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;