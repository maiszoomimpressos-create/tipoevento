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
import ImageUploadPicker from '@/components/ImageUploadPicker'; // Importando o novo componente

// Define the structure for the form data
interface EventFormData {
    title: string;
    description: string;
    date: Date | undefined; // Mantido como Date | undefined
    time: string;
    location: string; // General location name
    address: string; // Detailed address (new mandatory field)
    image_url: string; // Image URL (new mandatory field)
    min_age: number | string; // Minimum age (new mandatory field)
    category: string;
    capacity: number | string; // Capacidade
    duration: string; // NOVO: Duração
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
        capacity: '', // Inicializado como string vazia
        duration: '', // Inicializado como string vazia
    });
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({}); // Estado para erros de validação
    
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
        
        // Limpa o erro para o campo atual quando o usuário começa a digitar
        setFormErrors(prev => ({ ...prev, [id]: '' }));

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
        setFormErrors(prev => ({ ...prev, date: '' })); // Limpa o erro para o campo de data
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
        setFormErrors(prev => ({ ...prev, category: '' })); // Limpa o erro para o campo de categoria
    };
    
    const handleImageUpload = (url: string) => {
        setFormData(prev => ({ ...prev, image_url: url }));
        setFormErrors(prev => ({ ...prev, image_url: '' })); // Limpa o erro para o campo de imagem
    };

    const validateForm = (): { isValid: boolean, errors: { [key: string]: string }, isoDate: string | null } => {
        const newErrors: { [key: string]: string } = {};
        let isValid = true;
        let isoDate: string | null = null;
        
        if (!formData.title) { newErrors.title = "Título é obrigatório."; isValid = false; }
        if (!formData.description) { newErrors.description = "Descrição é obrigatória."; isValid = false; }
        if (!formData.time) { newErrors.time = "Horário é obrigatório."; isValid = false; }
        if (!formData.location) { newErrors.location = "Localização é obrigatória."; isValid = false; }
        if (!formData.address) { newErrors.address = "Endereço detalhado é obrigatório."; isValid = false; }
        if (!formData.image_url) { newErrors.image_url = "URL da Imagem/Banner é obrigatória."; isValid = false; }
        if (!formData.duration) { newErrors.duration = "Duração é obrigatória."; isValid = false; }
        
        // Validação da Data (agora é um objeto Date)
        if (!formData.date) {
            newErrors.date = "Data é obrigatória."; isValid = false;
        } else {
            // Converte para o formato ISO (YYYY-MM-DD) para salvar no Supabase
            isoDate = format(formData.date, 'yyyy-MM-dd');
        }

        const minAge = Number(formData.min_age);
        if (formData.min_age === '' || formData.min_age === null || isNaN(minAge) || minAge < 0) {
            newErrors.min_age = "Idade Mínima é obrigatória e deve ser 0 ou maior."; isValid = false;
        }
        
        const capacity = Number(formData.capacity);
        if (formData.capacity === '' || formData.capacity === null || isNaN(capacity) || capacity <= 0) {
            newErrors.capacity = "Capacidade é obrigatória e deve ser maior que zero."; isValid = false;
        }

        if (!formData.category) { newErrors.category = "Categoria é obrigatória."; isValid = false; }

        return { isValid, errors: newErrors, isoDate };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationResult = validateForm();
        setFormErrors(validationResult.errors); // Atualiza o estado de erros

        if (!validationResult.isValid || !userId || !validationResult.isoDate) {
            showError("Por favor, preencha todos os campos obrigatórios."); // Toast genérico
            return;
        }

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
                        capacity: Number(formData.capacity), // SALVANDO CAPACIDADE
                        duration: formData.duration, // SALVANDO DURAÇÃO
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
            setFormErrors({}); // Limpa todos os erros após o sucesso

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
                                    isInvalid={!!formErrors.title} // Passa a prop de erro
                                    required
                                />
                                {formErrors.title && <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>}
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-white mb-2">Localização (Nome do Local) *</label>
                                <Input 
                                    id="location" 
                                    value={formData.location} 
                                    onChange={handleChange} 
                                    placeholder="Ex: Teatro Municipal"
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                    isInvalid={!!formErrors.location} // Passa a prop de erro
                                    required
                                />
                                {formErrors.location && <p className="text-red-400 text-xs mt-1">{formErrors.location}</p>}
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
                                isInvalid={!!formErrors.address} // Passa a prop de erro
                                required
                            />
                            {formErrors.address && <p className="text-red-400 text-xs mt-1">{formErrors.address}</p>}
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
                                isInvalid={!!formErrors.description} // Passa a prop de erro
                                required
                            />
                            {formErrors.description && <p className="text-red-400 text-xs mt-1">{formErrors.description}</p>}
                        </div>
                        
                        {/* Linha 4: Imagem/Banner Preview - Usando o novo componente */}
                        <div className="space-y-4 pt-4 border-t border-yellow-500/20">
                            <h3 className="text-xl font-semibold text-white">Banner do Evento *</h3>
                            {userId && (
                                <ImageUploadPicker
                                    userId={userId}
                                    currentImageUrl={formData.image_url}
                                    onImageUpload={handleImageUpload}
                                    disabled={isLoading}
                                    width={550}
                                    height={380}
                                    placeholderText="Nenhuma imagem de banner selecionada."
                                    isInvalid={!!formErrors.image_url} // Passa a prop de erro
                                />
                            )}
                            {formErrors.image_url && <p className="text-red-400 text-xs mt-1">{formErrors.image_url}</p>}
                        </div>

                        {/* Linha 5: Data, Horário, Categoria */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-white mb-2">Data *</label>
                                <DatePicker 
                                    date={formData.date}
                                    setDate={handleDateChange}
                                    placeholder="DD/MM/AAAA ou Selecione"
                                    isInvalid={!!formErrors.date} // Passa a prop de erro
                                />
                                {formErrors.date && <p className="text-red-400 text-xs mt-1">{formErrors.date}</p>}
                            </div>
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-white mb-2">Horário *</label>
                                <Input 
                                    id="time" 
                                    type="time"
                                    value={formData.time} 
                                    onChange={handleChange} 
                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                    isInvalid={!!formErrors.time} // Passa a prop de erro
                                    required
                                />
                                {formErrors.time && <p className="text-red-400 text-xs mt-1">{formErrors.time}</p>}
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-white mb-2">Categoria *</label>
                                <Select onValueChange={handleSelectChange} value={formData.category}>
                                    <SelectTrigger 
                                        className="w-full bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500"
                                        isInvalid={!!formErrors.category} // Passa a prop de erro
                                    >
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
                                {formErrors.category && <p className="text-red-400 text-xs mt-1">{formErrors.category}</p>}
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
                                    isInvalid={!!formErrors.capacity} // Passa a prop de erro
                                    min="1"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Número máximo de pessoas permitidas.</p>
                                {formErrors.capacity && <p className="text-red-400 text-xs mt-1">{formErrors.capacity}</p>}
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
                                    isInvalid={!!formErrors.duration} // Passa a prop de erro
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Duração estimada do evento.</p>
                                {formErrors.duration && <p className="text-red-400 text-xs mt-1">{formErrors.duration}</p>}
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
                                    isInvalid={!!formErrors.min_age} // Passa a prop de erro
                                    min="0"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Defina 0 para classificação livre.</p>
                                {formErrors.min_age && <p className="text-red-400 text-xs mt-1">{formErrors.min_age}</p>}
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