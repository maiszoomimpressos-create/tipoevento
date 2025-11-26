import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, BarChart3, FileText, TrendingUp, Users } from 'lucide-react';

const ReportCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <Card 
        className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/60 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 cursor-pointer"
        onClick={onClick}
    >
        <CardHeader className="p-0 mb-4">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <CardTitle className="text-white text-xl">{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <CardDescription className="text-gray-400 text-sm">
                {description}
            </CardDescription>
        </CardContent>
    </Card>
);

const ManagerReports: React.FC = () => {
    const navigate = useNavigate();

    const handleReportClick = (reportName: string) => {
        alert(`Gerando relatório: ${reportName}`);
        // Aqui seria a lógica para navegar para um relatório específico ou gerar um PDF
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 flex items-center">
                    <BarChart3 className="h-7 w-7 mr-3" />
                    Central de Relatórios
                </h1>
                <Button 
                    onClick={() => navigate('/manager/dashboard')}
                    variant="outline"
                    className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Dashboard
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <ReportCard
                    icon={<TrendingUp className="h-6 w-6 text-yellow-500" />}
                    title="Relatório de Vendas"
                    description="Análise detalhada de receita, ingressos vendidos e performance por evento."
                    onClick={() => handleReportClick('Vendas')}
                />
                <ReportCard
                    icon={<FileText className="h-6 w-6 text-yellow-500" />}
                    title="Relatório de Eventos"
                    description="Status, ocupação e dados cadastrais de todos os eventos ativos e passados."
                    onClick={() => handleReportClick('Eventos')}
                />
                <ReportCard
                    icon={<Users className="h-6 w-6 text-yellow-500" />}
                    title="Relatório de Público"
                    description="Dados demográficos e comportamento dos clientes que compraram ingressos."
                    onClick={() => handleReportClick('Público')}
                />
            </div>
            
            <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
                <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-white text-xl flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-yellow-500" />
                        Visualização Rápida
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm">
                        Gráfico de vendas dos últimos 30 dias (em desenvolvimento).
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-64 bg-black/40 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                        <i className="fas fa-chart-bar text-yellow-500 text-4xl mb-4"></i>
                        <p className="text-gray-400">Gráficos de Analytics em breve</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerReports;