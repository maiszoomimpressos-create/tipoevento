"use client";

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from '@/data/events';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ImageOff, CalendarDays, ArrowLeft, Save, ArrowRight, Image, CheckSquare, FileText, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';
import ImageUploadPicker from '@/components/ImageUploadPicker';
import { useManagerCompany } from '@/hooks/use-manager-company';
import { useProfile } from '@/hooks/use-profile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useQueryClient } from '@tanstack/react-query'; // Importando useQueryClient

// Define the structure for the form data
interface EventFormData {
    title: string;
    description: string;
    date: Date | undefined;
    time: string;
    location: string;
    address: string;
    card_image_url: string; // 770x450 (Carrossel)
    exposure_card_image_url: string; // 400x200 (Listagem)
    banner_image_url: string; // 900x500 (Página do Evento)
    min_age: number | string;
    category: string;
    capacity: number | string;
    duration: string;
    // NOVOS CAMPOS DE INFRAESTRUTURA
    has_security: boolean;
    has_food_court: boolean;
    has_restrooms: boolean;
    has_parking: boolean;
    accept_contract: boolean; // Adicionado
}

// Zod schema for form validation
const eventSchema = z.object({
    title: z.string().min(1, "Título é obrigatório."),
    description: z.string().min(1, "Descrição é obrigatória."),
    date: z.date({ required_error: "Data é obrigatória." }),
    time: z.string().min(1, "Horário é obrigatório."),
    location: z.string().min(1, "Localização é obrigatória."),
    address: z.string().min(1, "Endereço detalhado é obrigatório."),
    
    // Imagens obrigatórias (validação de URL)
    card_image_url: z.string().url("URL da Imagem do Carrossel (770x450) é obrigatória."), 
    exposure_card_image_url: z.string().url("URL da Imagem do Card de Exposição (400x200) é obrigatória."), 
    banner_image_url: z.string().url("URL do Banner da Página do Evento (900x500) é obrigatória."),
    
    min_age: z.union([z.number().min(0, "Idade Mínima deve ser 0 ou maior."), z.literal('')]).transform(e => e === '' ? 0 : Number(e)),
    category: z.string().min(1, "Categoria é obrigatória."),
    capacity: z.union([z.number().min(1, "Capacidade deve ser maior que zero."), z.literal('')]).transform(e => e === '' ? 0 : Number(e)),
    duration: z.string().min(1, "Duração é obrigatória."),
    
    // NOVOS CAMPOS DE INFRAESTRUTURA
    has_security: z.boolean(),
    has_food_court: z.boolean(),
    has_restrooms: z.boolean(),
    has_parking: z.boolean(),
    accept_contract: z.boolean({ required_error: "Você deve aceitar os termos do contrato." }), // Adicionado
});

interface EventFormStepsProps {
    eventId?: string; // Optional for creation, required for editing
    initialData?: EventFormData;
    onSaveSuccess: (id: string) => void;
    onCancel: () => void;
}

const EventFormSteps: React.FC<EventFormStepsProps> = ({ eventId, initialData, onSaveSuccess, onCancel }) => {
    const queryClient = useQueryClient(); // Inicializando QueryClient
    const [step, setStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const { company, isLoading: isLoadingCompany } = useManagerCompany(userId || undefined);
    const { profile, isLoading: isLoadingProfile } = useProfile(userId || undefined);
    const [isDraftStatus, setIsDraftStatus] = useState(true); // Novo estado para rastrear o status de rascunho
    const [activeContract, setActiveContract] = useState<any>(null); // Contrato ativo
    const [commissionRanges, setCommissionRanges] = useState<any[]>([]); // Faixas de comissão
    const [calculatedCommission, setCalculatedCommission] = useState<{ percentage: number; rangeId: string } | null>(null); // Comissão calculada

    // Declaração única e correta de form e capacity
    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: '',
            description: '',
            date: undefined,
            time: '',
            location: '',
            address: '',
            card_image_url: '', 
            exposure_card_image_url: '', 
            banner_image_url: '', 
            min_age: 0,
            category: '',
            capacity: 0,
            duration: '',
            // Defaults para novos campos
            has_security: false,
            has_food_court: false,
            has_restrooms: false,
            has_parking: false,
            accept_contract: false, // Default para o checkbox de contrato
        },
        values: initialData,
    });

    const capacity = form.watch('capacity'); // Observa a capacidade para recalcular a comissão

    useEffect(() => {
        if (typeof capacity === 'number' && capacity > 0 && commissionRanges.length > 0) {
            const matchingRange = commissionRanges.find(range => 
                capacity >= range.min_tickets && capacity <= range.max_tickets
            );
            if (matchingRange) {
                setCalculatedCommission({ percentage: matchingRange.percentage, rangeId: matchingRange.id });
            } else {
                setCalculatedCommission(null);
                showError("Não foi encontrada uma faixa de comissão válida para a capacidade informada.");
            }
        } else {
            setCalculatedCommission(null);
        }
    }, [capacity, commissionRanges]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id || null);
        });

        // Busca o contrato ativo
        const fetchActiveContract = async () => {
            const { data, error } = await supabase
                .from('event_contracts')
                .select('*')
                .eq('is_active', true)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
                console.error("Erro ao buscar contrato ativo:", error);
                showError("Erro ao carregar o contrato ativo da plataforma.");
            }
            if (data) {
                setActiveContract(data);
            }
        };
        fetchActiveContract();

        // Busca as faixas de comissão ativas
        const fetchCommissionRanges = async () => {
            const { data, error } = await supabase
                .from('commission_ranges')
                .select('*')
                .eq('active', true)
                .order('min_tickets', { ascending: true });

            if (error) {
                console.error("Erro ao buscar faixas de comissão:", error);
                showError("Erro ao carregar as faixas de comissão.");
            }
            if (data) {
                setCommissionRanges(data);
            }
        };
        fetchCommissionRanges();
    }, []);

    // Função para carregar dados do evento para edição (incluindo o novo campo)
    useEffect(() => {
        const fetchEventDetails = async () => {
            if (!eventId || !userId) return;

            // Busca o evento para obter todos os dados, incluindo is_draft
            const { data: eventData, error: fetchError } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (fetchError || !eventData) {
                console.error("Erro ao buscar evento para edição:", fetchError);
                showError("Evento não encontrado ou você não tem permissão para editá-lo.");
                onCancel();
                return;
            }

            // Define o status de rascunho inicial
            setIsDraftStatus(eventData.is_draft ?? true);

            form.reset({
                title: eventData.title || '',
                description: eventData.description || '',
                date: eventData.date ? parseISO(eventData.date) : undefined,
                time: eventData.time || '',
                location: eventData.location || '',
                address: eventData.address || '',
                card_image_url: eventData.image_url || '', 
                exposure_card_image_url: eventData.exposure_card_image_url || '', 
                banner_image_url: eventData.banner_image_url || '', 
                min_age: eventData.min_age || 0,
                category: eventData.category || '',
                capacity: eventData.capacity || 0,
                duration: eventData.duration || '',
                // Carrega novos campos
                has_security: eventData.has_security ?? false,
                has_food_court: eventData.has_food_court ?? false,
                has_restrooms: eventData.has_restrooms ?? false,
                has_parking: eventData.has_parking ?? false,
                accept_contract: eventData.contract_accepted_at ? true : false, // Carrega o estado de aceitação do contrato
            });
        };
        
        // Só executa se estiver em modo de edição e o userId estiver carregado
        if (eventId && userId) {
            fetchEventDetails();
        }
    }, [eventId, userId, form, onCancel]);


    const handleCardImageUpload = (url: string) => {
        form.setValue('card_image_url', url, { shouldValidate: true });
    };
    
    const handleExposureCardImageUpload = (url: string) => {
        form.setValue('exposure_card_image_url', url, { shouldValidate: true });
    };
    
    const handleBannerImageUpload = (url: string) => {
        form.setValue('banner_image_url', url, { shouldValidate: true });
    };

    const handleNextStep = async () => {
        let isValid = false;
        
        if (step === 1) {
            // Valida Etapa 1: Apenas campos de texto/dados
            isValid = await form.trigger([
                'title', 'description', 'date', 'time', 'location', 'address', 
                'min_age', 'category', 'capacity', 'duration'
            ]);
            if (isValid) {
                setStep(2);
            } else {
                showError("Por favor, preencha todos os campos obrigatórios da Etapa 1.");
            }
        } else if (step === 2) {
            // Valida Etapa 2: Todas as Imagens
            isValid = await form.trigger([
                'card_image_url', 
                'exposure_card_image_url', 
                'banner_image_url'
            ]);
            if (isValid) {
                setStep(3);
            } else {
                showError("Por favor, preencha todos os campos de imagem obrigatórios da Etapa 2.");
            }
        } else if (step === 3) {
            // Valida Etapa 3: Campos de infraestrutura (todos são booleanos)
            // Antes de avançar para a Etapa 4, verifica se temos contrato ativo e comissão calculada
            if (!activeContract) {
                showError("Nenhum contrato ativo encontrado. Por favor, entre em contato com o administrador ou aguarde.");
                return; // Impede o avanço se não houver contrato
            }
            if (!calculatedCommission) {
                showError("Não foi possível calcular a comissão. Verifique a capacidade e as faixas de comissão.");
                return; // Impede o avanço se a comissão não puder ser calculada
            }
            setStep(4); // Avança para a nova etapa de contrato
        } else if (step === 4) {
            // Valida Etapa 4: Aceitação do contrato
            isValid = await form.trigger(['accept_contract']);
            if (!isValid) {
                showError("Você deve aceitar os termos do contrato para continuar.");
                return;
            }
            // Se tudo estiver válido, o submit final será disparado pelo botão "Finalizar e Publicar"
        }
    };

    const handlePreviousStep = () => {
        setStep(prev => Math.max(1, prev - 1));
    };
    
    // Função auxiliar para salvar o evento como rascunho ou completo
    const saveEvent = async (values: EventFormData, saveAsDraft: boolean) => {
        if (!userId || !company?.id) {
            showError("Usuário ou empresa não identificados.");
            return;
        }

        setIsSaving(true);
        
        // Se estiver em modo de edição, o status de rascunho é mantido como false (publicado)
        // a menos que o usuário clique em "Salvar Rascunho".
        const finalIsDraft = saveAsDraft; 
        
        const actionText = eventId 
            ? (finalIsDraft ? "Salvando rascunho..." : "Salvando alterações...")
            : (finalIsDraft ? "Salvando rascunho..." : "Publicando evento...");
            
        const successText = eventId 
            ? (finalIsDraft ? 'salvo como rascunho' : 'atualizado')
            : (finalIsDraft ? 'salvo como rascunho' : 'criado');

        const toastId = showLoading(actionText);

        const isoDate = values.date ? format(values.date, 'yyyy-MM-dd') : null;
        
        // Placeholder para geocodificação
        const geocodedLatitude = -23.5505; // Exemplo: Latitude de São Paulo
        const geocodedLongitude = -46.6333; // Exemplo: Longitude de São Paulo

        const eventDataToSave = {
            company_id: company.id,
            title: values.title,
            description: values.description,
            date: isoDate,
            time: values.time,
            location: values.location,
            address: values.address,
            image_url: values.card_image_url, // Imagem do Carrossel (770x450)
            exposure_card_image_url: values.exposure_card_image_url, // Imagem do Card de Exposição (400x200)
            banner_image_url: values.banner_image_url || null, // Imagem da Página do Evento (900x500)
            min_age: Number(values.min_age),
            category: values.category,
            capacity: Number(values.capacity),
            duration: values.duration,
            latitude: geocodedLatitude,
            longitude: geocodedLongitude,
            is_draft: finalIsDraft, // Define o status de rascunho
            // NOVOS CAMPOS DE INFRAESTRUTURA
            has_security: values.has_security,
            has_food_court: values.has_food_court,
            has_restrooms: values.has_restrooms,
            has_parking: values.has_parking,
            // Dados de comissão e contrato
            total_tickets: Number(values.capacity), // Total de ingressos é a capacidade
            applied_percentage: calculatedCommission?.percentage || 0,
            commission_range_id: calculatedCommission?.rangeId || null,
            contract_version: activeContract?.version || null,
            contract_accepted_at: values.accept_contract ? new Date().toISOString() : null, // Inclui aceitação do contrato
            // contract_ip será preenchido via trigger/edge function no backend para maior segurança
        };

        let currentEventId = eventId;

        try {
            // 1. Salvar/Atualizar o Evento Principal
            let eventResult;
            if (eventId) {
                // Update existing event
                eventResult = await supabase
                    .from('events')
                    .update(eventDataToSave)
                    .eq('id', eventId)
                    .select('id')
                    .single();
            } else {
                // Insert new event
                eventResult = await supabase
                    .from('events')
                    .insert([eventDataToSave])
                    .select('id')
                    .single();
            }

            if (eventResult.error) {
                throw eventResult.error;
            }
            currentEventId = eventResult.data.id;
            
            // 2. Gerenciamento do Banner do Carrossel
            if (!finalIsDraft) {
                // Se o evento for publicado/atualizado (não rascunho), cria/atualiza o banner
                const { error: bannerError } = await supabase
                    .from('event_carousel_banners')
                    .upsert(
                        {
                            event_id: currentEventId,
                            image_url: values.card_image_url, // Imagem 770x450
                            headline: values.title,
                            subheadline: values.description.substring(0, 100), // Limita a 100 caracteres
                            display_order: 0, // Padrão 0
                            start_date: isoDate, // Data do evento
                            end_date: isoDate,   // Data do evento (Ativo apenas no dia)
                            created_by: userId,
                        },
                        { onConflict: 'event_id' } // Garante que só haja 1 banner por evento
                    );

                if (bannerError) {
                    console.error("Warning: Failed to automatically create/update carousel banner:", bannerError);
                    // Não lançamos erro crítico, mas avisamos
                }
            } else {
                // Se o evento for salvo como rascunho, DELETA o banner do carrossel
                const { error: deleteBannerError } = await supabase
                    .from('event_carousel_banners')
                    .delete()
                    .eq('event_id', currentEventId);
                    
                if (deleteBannerError) {
                    console.error("Warning: Failed to delete carousel banner on draft save:", deleteBannerError);
                }
            }


            // 3. Invalida o cache de eventos públicos e carrossel
            queryClient.invalidateQueries({ queryKey: ['publicEvents'] });
            queryClient.invalidateQueries({ queryKey: ['carouselBanners'] });
            queryClient.invalidateQueries({ queryKey: ['managerEvents', userId] });


            dismissToast(toastId);
            showSuccess(`Evento "${values.title}" ${successText} com sucesso.`);
            
            // Se for edição, onSaveSuccess apenas redireciona para a lista de eventos.
            onSaveSuccess(currentEventId);

        } catch (error: any) {
            dismissToast(toastId);
            console.error("Erro ao salvar evento:", error);
            showError(`Falha ao salvar evento: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveDraft = async () => {
        // Pega todos os valores atuais do formulário, mesmo que incompletos
        const values = form.getValues();
        
        // Validação mínima para rascunho (apenas título)
        if (!values.title.trim()) {
            showError("O título do evento é necessário para salvar um rascunho.");
            return;
        }
        
        // Força a data para undefined se for inválida, para evitar erros de serialização
        if (values.date && isNaN(values.date.getTime())) {
            values.date = undefined;
        }

        // Salva como rascunho
        await saveEvent(values, true);
    };

    const onSubmit = async (values: EventFormData) => {
        // Ao submeter o formulário, sempre publicamos (is_draft = false)
        await saveEvent(values, false); 
    };

    if (isLoadingCompany || isLoadingProfile || !userId) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-0 text-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando dados do gestor...</p>
            </div>
        );
    }

    if (!company?.id) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-0 text-center py-20">
                <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-6 rounded-xl mb-8">
                    <i className="fas fa-exclamation-triangle text-2xl mb-3"></i>
                    <h3 className="font-semibold text-white mb-2">Perfil da Empresa Necessário</h3>
                    <p className="text-sm">Você precisa cadastrar o Perfil da Empresa antes de criar/editar eventos.</p>
                    <Button 
                        onClick={() => onCancel()} // Volta para a lista de eventos ou dashboard
                        className="mt-4 bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                        Ir para Perfil da Empresa
                    </Button>
                </div>
            </div>
        );
    }
    
    // Determina o texto do botão de submissão final
    let finalSubmitButtonText = 'Finalizar e Publicar';
    if (eventId) {
        finalSubmitButtonText = isDraftStatus ? 'Publicar Evento' : 'Salvar Alterações';
    } else if (step < 4) {
        // Não deve acontecer, mas como fallback para prevenir o texto incorreto no botão
        finalSubmitButtonText = 'Próxima Etapa';
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10">
                    <CardHeader>
                        <CardTitle className="text-white text-xl sm:text-2xl font-semibold">
                            {eventId ? `Editar Evento: ${form.watch('title') || 'Carregando...'}` : "Criar Novo Evento"}
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-sm">
                            {step === 1 && "Etapa 1 de 3: Detalhes básicos do evento."}
                            {step === 2 && "Etapa 2 de 3: Mídias e Imagens de destaque."}
                            {step === 3 && "Etapa 3 de 4: Infraestrutura e Serviços."}
                            {step === 4 && "Etapa 4 de 4: Contrato e Publicação."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* --- Etapa 1: Detalhes Básicos --- */}
                        {step === 1 && (
                            <div className="space-y-6">
                                {/* Linha 1: Título e Localização Geral */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Título do Evento *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Ex: Concerto Sinfônico Premium"
                                                        {...field} 
                                                        className={`bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 ${form.formState.errors.title ? 'border-red-500' : ''}`}
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Localização (Nome do Local) *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Ex: Teatro Municipal"
                                                        {...field} 
                                                        className={`bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 ${form.formState.errors.location ? 'border-red-500' : ''}`}
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Linha 2: Endereço Detalhado */}
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Endereço Detalhado (Rua, Número, Cidade) *</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Ex: Praça Ramos de Azevedo, s/n - República, São Paulo - SP"
                                                    {...field} 
                                                    className={`bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 ${form.formState.errors.address ? 'border-red-500' : ''}`}
                                                    disabled={isSaving}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Linha 3: Descrição */}
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Descrição Detalhada *</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Descreva o evento, destaques e público-alvo."
                                                    {...field} 
                                                    className={`bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 min-h-[100px] ${form.formState.errors.description ? 'border-red-500' : ''}`}
                                                    disabled={isSaving}
                                                />
                                            </FormControl>
                                                <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                {/* Linha 4: Data, Horário, Categoria */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Data *</FormLabel>
                                                <FormControl>
                                                    <DatePicker 
                                                        date={field.value}
                                                        setDate={field.onChange}
                                                        placeholder="DD/MM/AAAA ou Selecione"
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="time"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Horário *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="time"
                                                        {...field} 
                                                        className={`bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 ${form.formState.errors.time ? 'border-red-500' : ''}`}
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Categoria *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={isSaving}>
                                                    <FormControl>
                                                        <SelectTrigger className={`w-full bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500 ${form.formState.errors.category ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Selecione a Categoria" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-black border-yellow-500/30 text-white">
                                                        {categories.map(cat => (
                                                            <SelectItem key={cat.id} value={cat.name} className="hover:bg-yellow-500/10 cursor-pointer">
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                {/* Linha 5: Capacidade, Duração e Idade Mínima */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="capacity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Capacidade Máxima (Pessoas) *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number"
                                                        placeholder="Ex: 500"
                                                        {...field} 
                                                        onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                        className={`bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 ${form.formState.errors.capacity ? 'border-red-500' : ''}`}
                                                        min="1"
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="duration"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Duração (Ex: 2h30min) *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Ex: 3 horas ou 2h30min"
                                                        {...field} 
                                                        className={`bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 ${form.formState.errors.duration ? 'border-red-500' : ''}`}
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="min_age"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Idade Mínima (Anos) *</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number"
                                                        placeholder="0 (Livre)"
                                                        {...field} 
                                                        onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                                        className={`bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 ${form.formState.errors.min_age ? 'border-red-500' : ''}`}
                                                        min="0"
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                {/* Botões de Navegação da Etapa 1 */}
                                <div className="flex justify-between space-x-4 pt-4 border-t border-yellow-500/20">
                                    <Button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={isSaving}
                                        variant="outline"
                                        className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                                    >
                                        <Save className="mr-2 h-5 w-5" />
                                        Salvar Rascunho
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleNextStep}
                                        disabled={isSaving}
                                        className="bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                                    >
                                        Próxima Etapa
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* --- Etapa 2: Imagens de Destaque --- */}
                        {step === 2 && (
                            <div className="space-y-6">
                                
                                {/* Imagem 1: Card Principal (770x450) - Carrossel */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-xl font-semibold text-white flex items-center">
                                        <Image className="h-5 w-5 mr-2 text-yellow-500" />
                                        Imagem do Carrossel (770x450) *
                                    </h3>
                                    <CardDescription className="text-gray-400 text-sm">
                                        Esta imagem será usada **exclusivamente** no carrossel 3D.
                                    </CardDescription>
                                    {userId && (
                                        <ImageUploadPicker
                                            userId={userId}
                                            currentImageUrl={form.watch('card_image_url')}
                                            onImageUpload={handleCardImageUpload}
                                            width={770} 
                                            height={450} 
                                            placeholderText="Clique para enviar ou arraste e solte uma imagem (770px de largura por 450px de altura)."
                                            bucketName="event-banners"
                                            folderPath="banners"
                                            maxFileSizeMB={5}
                                            isInvalid={!!form.formState.errors.card_image_url}
                                            disabled={isSaving}
                                        />
                                    )}
                                    {form.formState.errors.card_image_url && <p className="text-red-500 text-xs mt-1">{form.formState.errors.card_image_url.message}</p>}
                                </div>
                                
                                {/* Imagem 2: Card de Exposição (400x200) - Listagem */}
                                <div className="space-y-4 pt-4 border-t border-yellow-500/20">
                                    <h3 className="text-xl font-semibold text-white flex items-center">
                                        <Image className="h-5 w-5 mr-2 text-yellow-500" />
                                        Imagem do Card de Exposição (400x200) *
                                    </h3>
                                    <CardDescription className="text-gray-400 text-sm">
                                        Esta imagem será usada **exclusivamente** na listagem de eventos (Index.tsx).
                                    </CardDescription>
                                    {userId && (
                                        <ImageUploadPicker
                                            userId={userId}
                                            currentImageUrl={form.watch('exposure_card_image_url')}
                                            onImageUpload={handleExposureCardImageUpload}
                                            width={400} 
                                            height={200} 
                                            placeholderText="Clique para enviar ou arraste e solte uma imagem (400px de largura por 200px de altura)."
                                            bucketName="event-banners"
                                            folderPath="exposure-cards"
                                            maxFileSizeMB={5}
                                            isInvalid={!!form.formState.errors.exposure_card_image_url}
                                            disabled={isSaving}
                                        />
                                    )}
                                    {form.formState.errors.exposure_card_image_url && <p className="text-red-500 text-xs mt-1">{form.formState.errors.exposure_card_image_url.message}</p>}
                                </div>

                                {/* Imagem 3: Banner da Tela do Evento (900x500) */}
                                <div className="space-y-4 pt-4 border-t border-yellow-500/20">
                                    <h3 className="text-xl font-semibold text-white flex items-center">
                                        <Image className="h-5 w-5 mr-2 text-yellow-500" />
                                        Banner da Página do Evento (900x500) *
                                    </h3>
                                    <CardDescription className="text-gray-400 text-sm">
                                        Esta imagem será usada **exclusivamente** como destaque principal no topo da página de detalhes do evento.
                                    </CardDescription>
                                    {userId && (
                                        <ImageUploadPicker
                                            userId={userId}
                                            currentImageUrl={form.watch('banner_image_url')}
                                            onImageUpload={handleBannerImageUpload}
                                            width={900}
                                            height={500}
                                            placeholderText="Clique para enviar ou arraste e solte uma imagem (900px de largura por 500px de altura) para a página de detalhes do evento."
                                            bucketName="event-banners"
                                            folderPath="banners-details"
                                            maxFileSizeMB={5}
                                            isInvalid={!!form.formState.errors.banner_image_url}
                                            disabled={isSaving}
                                        />
                                    )}
                                    {form.formState.errors.banner_image_url && <p className="text-red-500 text-xs mt-1">{form.formState.errors.banner_image_url.message}</p>}
                                </div>

                                {/* Botões de Navegação da Etapa 2 */}
                                <div className="flex justify-between space-x-4 pt-4 border-t border-yellow-500/20">
                                    <Button
                                        type="button"
                                        onClick={handlePreviousStep}
                                        disabled={isSaving}
                                        variant="outline"
                                        className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                                    >
                                        <ArrowLeft className="mr-2 h-5 w-5" />
                                        Voltar
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleNextStep}
                                        disabled={isSaving}
                                        className="bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                                    >
                                        Próxima Etapa
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        
                        {/* --- Etapa 3: Infraestrutura e Serviços --- */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-xl font-semibold text-white flex items-center">
                                        <CheckSquare className="h-5 w-5 mr-2 text-yellow-500" />
                                        Infraestrutura e Serviços
                                    </h3>
                                    <CardDescription className="text-gray-400 text-sm">
                                        Marque os itens de infraestrutura que estarão disponíveis no seu evento.
                                    </CardDescription>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Checkbox: Segurança */}
                                    <FormField
                                        control={form.control}
                                        name="has_security"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-yellow-500/20 p-4 bg-black/60">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="mt-1 border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="text-white font-medium">
                                                        Segurança (Equipe e Monitoramento)
                                                    </FormLabel>
                                                    <FormDescription className="text-gray-400">
                                                        Disponibilidade de equipe de segurança e monitoramento.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    
                                    {/* Checkbox: Praça de Alimentação */}
                                    <FormField
                                        control={form.control}
                                        name="has_food_court"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-yellow-500/20 p-4 bg-black/60">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="mt-1 border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="text-white font-medium">
                                                        Praça de Alimentação / Food Service
                                                    </FormLabel>
                                                    <FormDescription className="text-gray-400">
                                                        Disponibilidade de área de alimentação ou serviço de comida.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    
                                    {/* Checkbox: Banheiros */}
                                    <FormField
                                        control={form.control}
                                        name="has_restrooms"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-yellow-500/20 p-4 bg-black/60">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="mt-1 border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="text-white font-medium">
                                                        Banheiros (Limpos e Acessíveis)
                                                    </FormLabel>
                                                    <FormDescription className="text-gray-400">
                                                        Disponibilidade de banheiros adequados e acessíveis.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    
                                    {/* Checkbox: Estacionamento */}
                                    <FormField
                                        control={form.control}
                                        name="has_parking"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-yellow-500/20 p-4 bg-black/60">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="mt-1 border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                                                        disabled={isSaving}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="text-white font-medium">
                                                        Estacionamento (Próprio ou Conveniado)
                                                    </FormLabel>
                                                    <FormDescription className="text-gray-400">
                                                        Disponibilidade de estacionamento para o público.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Botões de Navegação da Etapa 3 */}
                                <div className="flex justify-between space-x-4 pt-4 border-t border-yellow-500/20">
                                    <Button
                                        type="button"
                                        onClick={handlePreviousStep}
                                        disabled={isSaving}
                                        variant="outline"
                                        className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                                    >
                                        <ArrowLeft className="mr-2 h-5 w-5" />
                                        Voltar
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleNextStep}
                                        disabled={isSaving}
                                        className="bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                                    >
                                        Próxima Etapa
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* --- Etapa 4: Contrato e Publicação --- */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-xl font-semibold text-white flex items-center">
                                        <FileText className="h-5 w-5 mr-2 text-yellow-500" />
                                        Termos e Condições da Plataforma
                                    </h3>
                                    <CardDescription className="text-gray-400 text-sm">
                                        Por favor, revise o contrato da plataforma e aceite para continuar.
                                        <br />
                                        <span className="font-semibold text-yellow-500">Comissão Aplicada: {calculatedCommission?.percentage.toFixed(2).replace('.', ',')}%.</span>
                                        <span className="ml-2 text-gray-500">(Baseado na capacidade de {form.watch('capacity')} ingressos)</span>
                                    </CardDescription>
                                </div>

                                {activeContract ? (
                                    <div className="border border-yellow-500/20 rounded-lg p-4 max-h-[300px] overflow-y-auto bg-black/50">
                                        <h4 className="text-lg font-semibold text-white mb-2">{activeContract.title} (Versão {activeContract.version})</h4>
                                        <div 
                                            className="prose prose-invert text-gray-300"
                                            dangerouslySetInnerHTML={{ __html: activeContract.content }}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-black/50 border border-red-500/30 rounded-lg">
                                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                        <p className="text-red-400 text-lg font-semibold">Nenhum contrato ativo encontrado.</p>
                                        <p className="text-gray-400 text-sm mt-2">Entre em contato com o suporte da plataforma.</p>
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="accept_contract"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-yellow-500/20 p-4 bg-black/60">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="mt-1 border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                                                    disabled={isSaving || !activeContract || !calculatedCommission}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-white font-medium">
                                                    Li e aceito os Termos de Uso e a política de comissão da plataforma.
                                                </FormLabel>
                                                <FormDescription className="text-gray-400">
                                                    Ao aceitar, você concorda com o percentual de comissão de <span className="font-semibold text-white">{calculatedCommission?.percentage.toFixed(2).replace('.', ',')}%</span> aplicado a este evento, com base na capacidade de <span className="font-semibold text-white">{form.watch('capacity')}</span> ingressos.
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                {/* Botões de Navegação da Etapa 4 */}
                                <div className="flex justify-between space-x-4 pt-4 border-t border-yellow-500/20">
                                    <Button
                                        type="button"
                                        onClick={handlePreviousStep}
                                        disabled={isSaving}
                                        variant="outline"
                                        className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer"
                                    >
                                        <ArrowLeft className="mr-2 h-5 w-5" />
                                        Voltar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSaving || !form.watch('accept_contract') || !activeContract || !calculatedCommission}
                                        className="bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-lg font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                Publicando Evento...
                                            </div>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-5 w-5" />
                                                {finalSubmitButtonText}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>
        </FormProvider>
    );
};

export default EventFormSteps;
