import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from '@/data/events';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ImageOff } from 'lucide-react';

// Define the structure for the form data
interface EventFormData {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string; // General location name
    address: string; // Detailed address
    image_url: string; // Image URL
    min_age: number | string; // Minimum age
    category: string;
    capacity: number | string; // Capacidade
    duration: string; // NOVO: Duração
}

const ManagerEditEvent: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [formData, setFormData] = useState<EventFormData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchEventAndUser = async () => {
            setIsFetching(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                showError("Sessão expirada ou não autenticada.");
                navigate('/manager/login');
                return;
            }
            setUserId(user.id);

            if (!id) {
                showError("ID do evento não fornecido.");
                navigate('/manager/events');
                return;
            }

            // Fetch event data
            const { data: eventData, error: fetchError } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError || !eventData) {
                console.error("Erro ao buscar evento:", fetchError);
                showError("Evento não encontrado ou você não tem permissão para editá-lo.");
                navigate('/manager/events');
                return;
            }

            // Basic check to ensure the user owns the event (RLS should handle this, but good practice)
            if (eventData.user_id !== user.id) {
                showError("Você não tem permissão para editar este evento.");
                navigate('/manager/events');
                return;
            }

            // Populate form data
            setFormData({
                title: eventData.title || '',
                description: eventData.description || '',
                date: eventData.date || '',
                time: eventData.time || '',
                location: eventData.location || '',
                address: eventData.address || '',
                image_url: eventData.image_url || '',
                min_age: eventData.min_age || 0,
                category: eventData.category || '',
                capacity: eventData.capacity || '', // Carregando capacidade
                duration: eventData.duration || '', // Carregando duração
            });
            setIsFetching(false);
        };

        fetchEventAndUser();
    }, [id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => {
            if (!prev) return null;
            return { 
                ...prev, 
                [id]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
            };
        });
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => {
            if (!prev) return null;
            return { ...prev, category: value };
        });
    };

    const validateForm = () => {
        if (!formData) return false;
        const errors: string[] = [];
        
        if (!formData.title) errors.push("Título é obrigatório.");
        if (!formData.description) errors.push("Descrição é obrigatória.");
        if (!formData.date) errors.push("Data é obrigatória.");
        if (!formData.time) errors.push("Horário é obrigatório.");
        if (!formData.location) errors.push("Localização é obrigatória.");
        if (!formData.address) errors.push("Endereço detalhado é obrigatório.");
        if (!formData.image_url) errors.push("URL da Imagem/Banner é obrigatória.");
        if (!formData.duration) errors.push("Duração é obrigatória."); // Validação de Duração
        
        const minAge = Number(formData.min_age);
        if (formData.min_age === '' || formData.min_age === null || isNaN(minAge) || minAge < 0) {
            errors.push("Idade Mínima é obrigatória e deve ser 0 ou maior.");
        }
        
        const capacity = Number(formData.capacity);
        if (formData.capacity === '' || formData.capacity === null || isNaN(capacity) || capacity <= 0) {
            errors.push("Capacidade é obrigatória e deve ser maior que zero.");
        }

        if (!formData.category) errors.push("Categoria é obrigatória.");
        // REMOVIDO: if (!formData.price || Number(formData.price) <= 0) errors.push("Preço Base é obrigatório e deve ser maior que zero.");

        if (errors.length > 0) {
            showError(`Por favor, preencha todos os campos obrigatórios.`);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !userId || !id || !formData) return;

        const toastId = showLoading("Atualizando evento...");
        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('events')
                .update({
                    title: formData.title,
                    description: formData.description,
                    date: formData.date,
                    time: formData.time,
                    location: formData.location,
                    address: formData.address,
                    image_url: formData.image_url,
                    min_age: Number(formData.min_age),
                    category: formData.category,
                    capacity: Number(formData.capacity), // SALVANDO CAPACIDADE
                    duration: formData.duration, // SALVANDO DURAÇÃO
                })
                .eq('id', id)
                .eq('user_id', userId); // Ensure only the owner can update

            if (error) {
                throw error;
            }

            dismissToast(toastId);
            showSuccess(`Evento "${formData.title}" atualizado com sucesso!`);
            navigate('/manager/events');

        } catch (error: any) {
            dismissToast(toastId);
            console.error("Erro ao atualizar evento:", error);
            showError(`Falha ao atualizar evento: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching || !formData) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-0 text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando detalhes do evento...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 mb-4 sm:mb-0">Editar Evento: {formData.title}</h1>
                <Button 
                    onClick={() => navigate('/manager/events')}
                    variant="outline"
                    className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Voltar para a Lista
                </Button>
            </div>

            <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10">
                <CardHeader>
                    <CardTitle className="text-white text-xl sm:text-2xl font-semibold">Detalhes do Evento</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Linha 1: Título e Localização Geral */}
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
                                <label htmlFor="location" className="block text-sm font-medium text-white mb-2">Localização (Nome do Local) *</label>
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

                        {/* Linha 2: Endereço Detalhado */}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-white mb-2">Endereço Detalhado (Rua, Número, Cidade) *</label>
                            <Input 
                                id="address" 
                                value={formData.address} 
                                onChange={handleChange} 
                                placeholder="Ex: Praça Ramos de Azevedo, s/n - República, São Paulo - SP"
                                className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                required
                            />
                        </div>

                        {/* Linha 3: Descrição */}
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
                        
                        {/* Linha 4: Imagem/Banner Preview */}
                        <div className="space-y-4 pt-4 border-t border-yellow-500/20">
                            <h3 className="text-xl font-semibold text-white">Banner do Evento</h3>
                            
                            {/* Preview da Imagem */}
                            <div className="w-full h-48 bg-black/60 border border-yellow-500/30 rounded-xl overflow-hidden flex items-center justify-center">
                                {formData.image_url ? (
                                    <img 
                                        src={formData.image_url} 
                                        alt="Preview do Banner" 
                                        className="w-full h-full object-cover object-center"
                                        onError={(e) => {
                                            // Fallback se a URL da imagem estiver quebrada
                                            e.currentTarget.onerror = null; 
                                            e.currentTarget.src = 'placeholder.svg'; // Usar um placeholder local
                                            e.currentTarget.className = "w-16 h-16 text-gray-500";
                                        }}
                                    />
                                ) : (
                                    <div className="text-center text-gray-500">
                                        <ImageOff className="h-8 w-8 mx-auto mb-2" />
                                        Nenhuma URL de imagem fornecida.
                                    </div>
                                )}
                            </div>

                            {/* Campo URL da Imagem */}
                            <div>
                                <label htmlFor="image_url" className="block text-sm font-medium text-white mb-2">URL da Imagem/Banner *</label>
                                <Input 
                                    id="image_url" 
                                    value={formData.image_url} 
                                    onChange={handleChange} 
                                    placeholder="Ex: https://readdy.ai/api/search-image?query=..."
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Cole a URL da imagem do banner aqui para pré-visualizar acima.</p>
                            </div>
                        </div>

                        {/* Linha 5: Data, Horário, Categoria */}
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
                                <Select onValueChange={handleSelectChange} value={formData.category}>
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
                        
                        {/* Linha 6: Capacidade, Duração e Idade Mínima */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="capacity" className="block text-sm font-medium text-white mb-2">Capacidade Máxima (Pessoas) *</label>
                                <Input 
                                    id="capacity" 
                                    type="number"
                                    value={formData.capacity} 
                                    onChange={handleChange} 
                                    placeholder="Ex: 500"
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                    min="1"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Número máximo de pessoas.</p>
                            </div>
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-white mb-2">Duração (Ex: 2h30min) *</label>
                                <Input 
                                    id="duration" 
                                    type="text"
                                    value={formData.duration} 
                                    onChange={handleChange} 
                                    placeholder="Ex: 3 horas ou 2h30min"
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Duração estimada do evento.</p>
                            </div>
                            <div>
                                <label htmlFor="min_age" className="block text-sm font-medium text-white mb-2">Idade Mínima (Anos) *</label>
                                <Input 
                                    id="min_age" 
                                    type="number"
                                    value={formData.min_age} 
                                    onChange={handleChange} 
                                    placeholder="0 (Livre)"
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                    min="0"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Defina 0 para classificação livre.</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading || !userId}
                                className="bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 flex-1"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Salvando Alterações...
                                    </div>
                                ) : (
                                    <>
                                        <i className="fas fa-save mr-2"></i>
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => navigate('/manager/events')}
                                variant="outline"
                                className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer flex-1"
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Voltar para a Lista
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerEditEvent;