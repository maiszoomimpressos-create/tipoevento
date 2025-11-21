import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from '@/data/events';
import { showSuccess } from '@/utils/toast';

const ManagerCreateEvent: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: '',
        price: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Simulação de envio de dados
        setTimeout(() => {
            showSuccess(`Evento "${formData.title}" criado com sucesso!`);
            setIsLoading(false);
            navigate('/manager/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-black text-white pt-20 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-serif text-yellow-500">Criar Novo Evento</h1>
                    <Button 
                        onClick={() => navigate('/manager/dashboard')}
                        variant="outline"
                        className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Voltar ao Dashboard
                    </Button>
                </div>

                <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10">
                    <CardHeader>
                        <CardTitle className="text-white text-2xl font-semibold">Detalhes do Evento Premium</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-white mb-2">Título do Evento *</label>
                                    <Input 
                                        id="title" 
                                        value={formData.title} 
                                        onChange={handleChange} 
                                        placeholder="Ex: Concerto Sinfônico Premium"
                                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-white mb-2">Localização *</label>
                                    <Input 
                                        id="location" 
                                        value={formData.location} 
                                        onChange={handleChange} 
                                        placeholder="Ex: Teatro Municipal"
                                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">Descrição Detalhada *</label>
                                <Textarea 
                                    id="description" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    placeholder="Descreva o evento, destaques e público-alvo."
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 min-h-[100px]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-white mb-2">Data *</label>
                                    <Input 
                                        id="date" 
                                        type="date"
                                        value={formData.date} 
                                        onChange={handleChange} 
                                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="time" className="block text-sm font-medium text-white mb-2">Horário *</label>
                                    <Input 
                                        id="time" 
                                        type="time"
                                        value={formData.time} 
                                        onChange={handleChange} 
                                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-white mb-2">Categoria *</label>
                                    <Select onValueChange={handleSelectChange} required>
                                        <SelectTrigger className="w-full bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500">
                                            <SelectValue placeholder="Selecione a Categoria" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-yellow-500/30 text-white">
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.name} className="hover:bg-yellow-500/10 cursor-pointer">
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-white mb-2">Preço Base (R$) *</label>
                                <Input 
                                    id="price" 
                                    type="number"
                                    value={formData.price} 
                                    onChange={handleChange} 
                                    placeholder="0.00"
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                                        Salvando Evento...
                                    </div>
                                ) : (
                                    <>
                                        <i className="fas fa-calendar-plus mr-2"></i>
                                        Publicar Evento
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ManagerCreateEvent;