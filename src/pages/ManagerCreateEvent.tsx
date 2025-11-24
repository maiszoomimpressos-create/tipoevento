import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { categories } from '@/data/events';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowLeft, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';

// Define the structure for the form data
interface EventFormData {
    title: string;
    description: string;
    date: Date | undefined; // Alterado para tipo Date | undefined
    time: string;
    location: string; // General location name
    address: string; // Detailed address (new mandatory field)
    image_url: string; // Image URL (new mandatory field)
    min_age: number | string; // Minimum age (new mandatory field)
    category: string;
    price: string;
}

const ManagerCreateEvent: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        date: undefined, // Inicializado como undefined
        time: '',
        location: '',
        address: '',
        image_url: '',
        min_age: 0,
        category: '',
        price: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    
    // Estado para o modal de pulseiras
    const [showWristbandModal, setShowWristbandModal] = useState(false);
    const [newEventId, setNewEventId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch current user ID
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                setUserId(user.id);
            } else {
                // Redirect to manager login if no user is found (basic protection)
                showError("Sessão expirada ou não autenticada. Faça login novamente.");
                navigate('/manager/login');
            }
        });
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        
        if (type === 'number') {
            setFormData(prev => ({ 
                ...prev, 
                [id]: value === '' ? '' : Number(value) 
            }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };
    
    const handleDateChange = (date: Date | undefined) => {
        setFormData(prev => ({ ...prev, date }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
    };

    const validateForm = (): { isValid: boolean, isoDate: string | null } => {
        const errors: string[] = [];
        let isoDate: string | null = null;
        
        if (!formData.title) errors.push("Título é obrigatório.");
        if (!formData.description) errors.push("Descrição é obrigatória.");
        if (!formData.time) errors.push("Horário é obrigatório.");
        if (!formData.location) errors.push("Localização é obrigatória.");
        if (!formData.address) errors.push("Endereço detalhado é obrigatório.");
        if (!formData.image_url) errors.push("URL da Imagem/Banner é obrigatória.");
        
        // Validação da Data (agora é um objeto Date)
        if (!formData.date) {
            errors.push("Data é obrigatória.");
        } else {
            // Converte para o formato ISO (YYYY-MM-DD) para salvar no Supabase
            isoDate = format(formData.date, 'yyyy-MM-dd');
        }

        const minAge = Number(formData.min_age);
        if (formData.min_age === '' || formData.min_age === null || isNaN(minAge) || minAge < 0) {
            errors.push("Idade Mínima é obrigatória e deve ser 0 ou maior.");
        }

        if (!formData.category) errors.push("Categoria é obrigatória.");
        if (!formData.price || Number(formData.price) <= 0) errors.push("Preço Base é obrigatório e deve ser maior que zero.");

        if (errors.length > 0) {
            showError(`Por favor, preencha todos os campos corretamente.`);
            return { isValid: false, isoDate: null };
        }
        return { isValid: true, isoDate };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationResult = validateForm();
        
        if (!validationResult.isValid || !userId || !validationResult.isoDate) return;

        const toastId = showLoading("Publicando evento...");
        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from('events')
                .insert([
                    {
                        user_id: userId,
                        title: formData.title,
                        description: formData.description,
                        date: validationResult.isoDate, // Usando a data formatada para ISO
                        time: formData.time,
                        location: formData.location,
                        address: formData.address,
                        image_url: formData.image_url,
                        min_age: Number(formData.min_age),
                        category: formData.category,
                        price: Number(formData.price),
                    },
                ])
                .select('id')
                .single();

            if (error) {
                throw error;
            }

            dismissToast(toastId);
            showSuccess(`Evento "${formData.title}" criado com sucesso!`);
            
            setNewEventId(data.id);
            setShowWristbandModal(true);

        } catch (error: any) {
            dismissToast(toastId);
            console.error("Erro ao criar evento:", error);
            showError(`Falha ao publicar evento: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEmitirPulseiras = () => {
        setShowWristbandModal(false);
        navigate('/manager/wristbands/create');
    };

    const handleNaoEmitir = () => {
        setShowWristbandModal(false);
        navigate('/manager/dashboard');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif text-yellow-500 mb-4 sm:mb-0">Criar Novo Evento</h1>
                <Button 
                    onClick={() => navigate('/manager/dashboard')}
                    variant="outline"
                    className="bg-black/60 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Dashboard
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
                                <DatePicker 
                                    date={formData.date}
                                    setDate={handleDateChange}
                                    placeholder="Selecione a data do evento"
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
                        
                        {/* Linha 6: Preço Base e Idade Mínima */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-white mb-2">Preço Base (R$) *</label>
                                <Input 
                                    id="price" 
                                    type="number"
                                    value={formData.price} 
                                    onChange={handleChange} 
                                    placeholder="0.00"
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                    min="0"
                                    step="0.01"
                                    required
                                />
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

                        <Button
                            type="submit"
                            disabled={isLoading || !userId}
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
            
            {/* Modal de Confirmação de Pulseiras */}
            <AlertDialog open={showWristbandModal} onOpenChange={setShowWristbandModal}>
                <AlertDialogContent className="bg-black/90 border border-yellow-500/30 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-yellow-500 text-xl">Próxima Etapa: Pulseiras</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            O evento "{formData.title}" foi criado com sucesso! Você deseja cadastrar as pulseiras de acesso agora?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            onClick={handleNaoEmitir}
                            className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                        >
                            Não, Voltar ao Dashboard
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleEmitirPulseiras} 
                            className="bg-yellow-500 text-black hover:bg-yellow-600"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Emitir Pulseiras
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ManagerCreateEvent;