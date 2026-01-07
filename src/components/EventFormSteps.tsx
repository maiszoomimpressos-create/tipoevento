import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, ImageOff, CalendarDays, ArrowLeft, Save, ArrowRight, Image, CheckSquare, FileText, XCircle, Plus, Ticket } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DatePicker } from '@/components/DatePicker';
import ImageUploadPicker from '@/components/ImageUploadPicker';
import { useManagerCompany, CompanyData } from '@/hooks/use-manager-company';
import { useProfile } from '@/hooks/use-profile';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useQueryClient, useQuery } from '@tanstack/react-query'; // Importando useQueryClient e useQuery

interface EventContract {
    id: string;
    version: string;
    title: string;
    content: string;
    is_active: boolean;
    created_at: string;
    created_by: string | null;
    updated_at: string;
}

// Definição do esquema de validação do formulário
const eventFormSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres.").max(100, "O título não pode exceder 100 caracteres."),
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres.").max(1000, "A descrição não pode exceder 1000 caracteres."),
    date: z.date({ required_error: "A data do evento é obrigatória." }),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)."),
    location: z.string().min(3, "O local deve ter pelo menos 3 caracteres.").max(100, "O local não pode exceder 100 caracteres."),
    address: z.string().min(5, "O endereço deve ter pelo menos 5 caracteres.").max(200, "O endereço não pode exceder 200 caracteres."),
    card_image_url: z.string().url("URL da imagem do card inválida."),
    exposure_card_image_url: z.string().url("URL da imagem de exposição inválida."),
    banner_image_url: z.string().url("URL da imagem do banner inválida."),
    min_age: z.string().regex(/^([0-9]|1[0-8])$/, "A idade mínima deve ser entre 0 e 18 anos."),
    category: z.string().min(1, "A categoria é obrigatória."),
    capacity: z.string().regex(/^[1-9]\d*$/, "A capacidade deve ser um número inteiro positivo."),
    duration: z.string().min(1, "A duração é obrigatória."),
    is_paid: z.boolean().default(false),
    ticket_price: z.string().optional().refine(val => {
        if (val === undefined || val === '') return true; // Permite vazio se não for pago
        return /^[0-9]+([,.][0-9]{1,2})?$/.test(val.replace('.', '').replace(',', '.'));
    }, "Preço do ingresso inválido."),
    // Novo campo para o número de lotes
    num_batches: z.string().optional().refine(val => {
        if (val === undefined || val === '') return true; // Permite vazio
        return /^[1-9]\d*$/.test(val); // Deve ser um número inteiro positivo
    }, "Número de lotes deve ser um número inteiro positivo."),
    // Novo campo para os detalhes de cada lote
    batches: z.array(z.object({
        name: z.string().min(1, "Nome do lote é obrigatório."),
        quantity: z.string().regex(/^[1-9]\d*$/, "Quantidade deve ser um número inteiro positivo."),
        price: z.string().refine(val => /^[0-9]+([,.][0-9]{1,2})?$/.test(val.replace('.', '').replace(',', '.')), "Preço inválido."),
        start_date: z.date({ required_error: "Data de início é obrigatória." }),
        end_date: z.date({ required_error: "Data de término é obrigatória." }),
    })).optional(),
    contractAccepted: z.boolean().refine(val => val === true, "Você deve ler e aceitar os termos do contrato."),
    contract_id: z.string().optional(), // Para armazenar o ID do contrato aceito
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormStepsProps {
    initialData?: EventFormData | null;
    eventId?: string;
    userId?: string | null; // Adicionar userId como prop opcional
}

const EventFormSteps: React.FC<EventFormStepsProps> = ({ initialData, eventId, userId: propUserId }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(propUserId || null);

    const { profile, isLoading: isLoadingProfile } = useProfile(userId);
    const { company, isLoading: isLoadingCompany } = useManagerCompany(userId);

    const { data: activeContract, isLoading: isLoadingContract } = useQuery<EventContract | null>({ // Adicionado useQuery para buscar contrato
        queryKey: ['activeEventContract'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('event_contracts')
                .select('*')
                .eq('is_active', true)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching active contract:", error);
                showError("Erro ao carregar o contrato ativo.");
                return null;
            }
            return data as EventContract | null;
        },
        enabled: !!userId, // Habilita a query apenas se userId existir
        staleTime: 1000 * 60 * 5,
    });

    const methods = useForm<EventFormData>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            date: initialData?.date ? parseISO(initialData.date.toISOString()) : undefined,
            time: initialData?.time || '',
            location: initialData?.location || '',
            address: initialData?.address || '',
            card_image_url: initialData?.card_image_url || '',
            exposure_card_image_url: initialData?.exposure_card_image_url || '',
            banner_image_url: initialData?.banner_image_url || '',
            min_age: initialData?.min_age?.toString() || '',
            category: initialData?.category || '',
            capacity: initialData?.capacity?.toString() || '',
            duration: initialData?.duration || '',
            is_paid: initialData?.is_paid || false,
            ticket_price: initialData?.ticket_price?.toString().replace('.', ',') || '',
            num_batches: initialData?.batches?.length.toString() || '1', // Default para 1 lote
            batches: initialData?.batches?.map(batch => ({
                ...batch, 
                price: batch.price.toString().replace('.', ','), // Formata o preço para BR
                start_date: parseISO(batch.start_date.toString()),
                end_date: parseISO(batch.end_date.toString())
            })) || [
                { name: 'Lote 1', quantity: '', price: '', start_date: undefined, end_date: undefined } // Lote inicial
            ],
            contractAccepted: false,
            contract_id: initialData?.contract_id || undefined, // Inicializa com o contrato existente
        },
    });

    const { handleSubmit, control, setValue, watch, formState: { errors } } = methods;

    const isPaid = watch('is_paid');
    const numBatches = parseInt(watch('num_batches') || '0');
    const batches = watch('batches');

    // TODOS OS HOOKS DEVEM SER CHAMADOS ANTES DE QUALQUER RETURN CONDICIONAL
    // Carrega o userId ao montar apenas se não foi fornecido como prop
    useEffect(() => {
        if (!propUserId) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                setUserId(user?.id || null);
            });
        } else {
            setUserId(propUserId);
        }
    }, [propUserId]);

    // Atualiza o número de lotes dinamicamente
    useEffect(() => {
        if (isPaid) {
            const currentBatches = methods.getValues('batches') || [];
            if (numBatches > currentBatches.length) {
                // Adiciona novos lotes
                const newBatches = Array.from({ length: numBatches - currentBatches.length }, (_, i) => ({
                    name: `Lote ${currentBatches.length + i + 1}`,
                    quantity: '',
                    price: '',
                    start_date: undefined,
                    end_date: undefined,
                }));
                setValue('batches', [...currentBatches, ...newBatches]);
            } else if (numBatches < currentBatches.length) {
                // Remove lotes excedentes
                setValue('batches', currentBatches.slice(0, numBatches));
            }
        }
    }, [numBatches, isPaid, methods, setValue]);

    // Se estiver editando um evento e já tiver um contract_id, marcar como aceito
    useEffect(() => {
        if (eventId && initialData?.contract_id && activeContract) {
            setValue('contractAccepted', true);
            setValue('contract_id', activeContract.id);
        }
    }, [eventId, initialData, activeContract, setValue]);

    // AGORA PODEMOS FAZER OS RETURNS CONDICIONAIS
    // Garante que o userId esteja disponível para ImageUploadPicker
    if (isLoadingProfile || isLoadingCompany || isLoadingContract) {
        return (
            <div className="max-w-7xl mx-auto text-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Carregando informações essenciais...</p>
            </div>
        );
    }

    if (!userId || !profile) {
        return (
            <div className="max-w-7xl mx-auto text-center py-20">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <p className="text-red-400">Não foi possível carregar as informações do usuário. Por favor, tente novamente.</p>
            </div>
        );
    }

    const onSubmit = async (values: EventFormData) => {
        if (!userId || !profile) {
            showError("Informações do usuário não carregadas.");
            return;
        }

        if (activeContract && !values.contractAccepted) {
            showError("Você deve aceitar o contrato para criar/atualizar o evento.");
            return;
        }

        setIsSaving(true);
        const toastId = showLoading(eventId ? "Atualizando evento..." : "Criando novo evento...");

        try {
            const validCompany = company; // Asserção de tipo implícita
            const eventData = {
                title: values.title,
                description: values.description,
                event_date: format(values.date!, 'yyyy-MM-dd'),
                event_time: values.time,
                location: values.location,
                address: values.address,
                card_image_url: values.card_image_url,
                exposure_card_image_url: values.exposure_card_image_url,
                banner_image_url: values.banner_image_url,
                min_age: Number(values.min_age),
                category: values.category,
                capacity: Number(values.capacity),
                duration: values.duration,
                is_paid: values.is_paid,
                ticket_price: values.is_paid && values.ticket_price ? parseFloat(values.ticket_price.replace(',', '.')) : null,
                created_by: userId,
                company_id: company ? (company as CompanyData).id : null, // Permite null para gerentes PF (Pessoa Física)
                status: 'pending', // Eventos são criados como pendentes e aprovados por um admin
                contract_id: activeContract?.id || null, // Adiciona o ID do contrato
            };

            let newEventId = eventId;
            if (eventId) {
                // Update existente
                const { error } = await supabase
                    .from('events')
                    .update(eventData)
                    .eq('id', eventId);

                if (error) throw error;
                showSuccess("Evento atualizado com sucesso!");
            } else {
                // Insert novo
                const { data, error } = await supabase
                    .from('events')
                    .insert([eventData])
                    .select('id')
                    .single();

                if (error) throw error;
                newEventId = data.id;
                showSuccess("Evento criado com sucesso e enviado para aprovação!");
            }

            // Lógica para lotes (se for pago)
            if (values.is_paid && newEventId && values.batches) {
                // Exclui lotes antigos para recriar (simples para este exemplo, considerar updates mais complexos para produção)
                await supabase.from('event_batches').delete().eq('event_id', newEventId);

                const batchesToInsert = values.batches.map(batch => ({
                    event_id: newEventId,
                    name: batch.name,
                    quantity: Number(batch.quantity),
                    price: parseFloat(batch.price.replace(',', '.')),
                    start_date: format(batch.start_date!, 'yyyy-MM-dd'),
                    end_date: format(batch.end_date!, 'yyyy-MM-dd'),
                }));

                const { error: batchesError } = await supabase
                    .from('event_batches')
                    .insert(batchesToInsert);
                
                if (batchesError) throw batchesError;
                showSuccess("Lotes do evento salvos com sucesso!");
            }

            queryClient.invalidateQueries({ queryKey: ['managerEvents', userId] });
            queryClient.invalidateQueries({ queryKey: ['publicEvents'] });
            navigate('/manager/events');

        } catch (error: any) {
            console.error("Erro ao salvar evento:", error);
            showError(`Falha ao salvar evento: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Passo 0: Aceite do Contrato (Opcional, se houver contrato ativo) */}
                {isLoadingContract && (
                    <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-yellow-500 mx-auto" />
                        <p className="text-gray-400 text-sm">Carregando contrato...</p>
                    </div>
                )}
                {activeContract && currentStep === 1 && (
                    <Card className="bg-black border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardHeader>
                            <CardTitle className="text-yellow-500 text-2xl flex items-center">
                                <FileText className="h-6 w-6 mr-2" />
                                Contrato de Evento: {activeContract.title} (v{activeContract.version})
                            </CardTitle>
                            <CardDescription className="text-gray-400">Por favor, leia e aceite os termos do contrato para prosseguir.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="prose prose-invert max-h-[400px] overflow-y-auto p-4 border border-yellow-500/20 rounded-lg">
                                <div dangerouslySetInnerHTML={{ __html: activeContract.content }} />
                            </div>
                            <FormField
                                control={control}
                                name="contractAccepted"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-yellow-500/30 p-4 mt-6">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="border-yellow-500 text-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-white">
                                                Eu li e aceito os termos do contrato acima.
                                            </FormLabel>
                                            <FormDescription className="text-gray-400 text-xs">
                                                É obrigatório aceitar o contrato para criar um novo evento.
                                            </FormDescription>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Passo 1: Informações Básicas */}
                {currentStep === (activeContract ? 2 : 1) && (
                    <Card className="bg-black border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardHeader>
                            <CardTitle className="text-yellow-500 text-2xl">{activeContract ? '2.' : '1.'} Detalhes do Evento</CardTitle>
                            <CardDescription className="text-gray-400">Informações essenciais sobre o seu evento.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Título do Evento</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Ex: Show de Rock da Banda XYZ" 
                                                className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Descrição Detalhada</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Descreva seu evento em detalhes..." 
                                                rows={5}
                                                className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-white">Data do Evento</FormLabel>
                                            <DatePicker 
                                                date={field.value} 
                                                setDate={field.onChange} 
                                                placeholder="Selecione a data" 
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Hora do Evento</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="time" 
                                                    placeholder="HH:MM" 
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Local do Evento</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Ex: Arena Music Hall" 
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Endereço Completo</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Ex: Av. Principal, 123 - Centro" 
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Passo 2: Mídias e Outras Configurações */}
                {currentStep === (activeContract ? 3 : 2) && (
                    <Card className="bg-black border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardHeader>
                            <CardTitle className="text-yellow-500 text-2xl">{activeContract ? '3.' : '2.'} Mídias e Configurações</CardTitle>
                            <CardDescription className="text-gray-400">Imagens e detalhes adicionais do evento.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={control}
                                name="card_image_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Imagem do Card (proporção 16:9)</FormLabel>
                                        <FormControl>
                                            <ImageUploadPicker
                                                userId={userId!}
                                                currentImageUrl={field.value}
                                                onImageUpload={field.onChange}
                                                placeholderText="URL da imagem do card"
                                                folderPath="event_cards"
                                                width={1920}
                                                height={1080}
                                                isInvalid={!!errors.card_image_url}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-gray-500 text-xs">Esta imagem será usada na listagem de eventos. Recomendado 1920x1080px.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={control}
                                name="exposure_card_image_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Imagem de Exposição (proporção 16:9)</FormLabel>
                                        <FormControl>
                                            <ImageUploadPicker
                                                userId={userId!}
                                                currentImageUrl={field.value}
                                                onImageUpload={field.onChange}
                                                placeholderText="URL da imagem de exposição"
                                                folderPath="event_exposure_cards"
                                                width={1920}
                                                height={1080}
                                                isInvalid={!!errors.exposure_card_image_url}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-gray-500 text-xs">Esta imagem será usada em carrosséis e áreas de destaque. Recomendado 1920x1080px.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name="banner_image_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-white">Imagem do Banner (proporção 3:1)</FormLabel>
                                        <FormControl>
                                            <ImageUploadPicker
                                                userId={userId!}
                                                currentImageUrl={field.value}
                                                onImageUpload={field.onChange}
                                                placeholderText="URL da imagem do banner"
                                                folderPath="event_banners"
                                                width={1920}
                                                height={640}
                                                isInvalid={!!errors.banner_image_url}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-gray-500 text-xs">Esta imagem será usada como banner principal na página do evento. Recomendado 1920x640px.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name="min_age"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Idade Mínima</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Ex: 18" 
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                    {...field} 
                                                    onChange={e => field.onChange(e.target.value)}
                                                    min={0}
                                                    max={18}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Categoria</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-black/60 border-yellow-500/30 text-white focus:ring-yellow-500">
                                                        <SelectValue placeholder="Selecione uma categoria" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-black border border-yellow-500/30 text-white">
                                                    <SelectItem value="" disabled>Selecione uma categoria</SelectItem>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.name} className="hover:bg-yellow-500/10">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={control}
                                    name="capacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Capacidade Máxima de Pessoas</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Ex: 1000" 
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                    {...field} 
                                                    onChange={e => field.onChange(e.target.value)}
                                                    min={1}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-gray-500 text-xs">Número total de ingressos disponíveis para o evento.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-white">Duração Estimada (horas)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Ex: 3 horas" 
                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={control}
                                name="is_paid"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-yellow-500/30 p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="border-yellow-500 text-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-white">Evento Pago?</FormLabel>
                                            <FormDescription className="text-gray-400 text-xs">
                                                Marque esta opção se o evento tiver ingressos pagos.
                                            </FormDescription>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Passo 3: Preço e Lotes de Ingressos (condicional) */}
                {currentStep === (activeContract ? 4 : 3) && isPaid && (
                    <Card className="bg-black border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                        <CardHeader>
                            <CardTitle className="text-yellow-500 text-2xl flex items-center">
                                <Ticket className="h-6 w-6 mr-2" />
                                {activeContract ? '4.' : '3.'} Preço e Lotes de Ingressos
                            </CardTitle>
                            <CardDescription className="text-gray-400">Defina os preços e organize os ingressos em lotes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isPaid && (
                                <p className="text-gray-500 text-center py-4">Evento Gratuito. Nenhuma configuração de preço necessária.</p>
                            )}

                            {isPaid && (
                                <>
                                    <FormField
                                        control={control}
                                        name="num_batches"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white">Número de Lotes</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="1" 
                                                        className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                        {...field} 
                                                        onChange={e => field.onChange(e.target.value)} 
                                                        min={1}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-gray-500 text-xs">Quantos lotes de ingressos você deseja criar para este evento.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {Array.from({ length: numBatches }).map((_, batchIndex) => (
                                        <Card key={batchIndex} className="bg-black/70 border border-yellow-500/20 p-4 space-y-4">
                                            <CardTitle className="text-white text-lg">Lote {batchIndex + 1}</CardTitle>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <FormField
                                                    control={control}
                                                    name={`batches.${batchIndex}.name`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-white">Nome do Lote</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    placeholder="Ex: Lote Promocional" 
                                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                                    {...field} 
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={control}
                                                    name={`batches.${batchIndex}.quantity`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-white">Quantidade de Ingressos</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    type="number" 
                                                                    placeholder="Ex: 100" 
                                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                                    {...field} 
                                                                    onChange={e => field.onChange(e.target.value)} 
                                                                    min={1}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={control}
                                                    name={`batches.${batchIndex}.price`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-white">Preço (R$)</FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    placeholder="Ex: 50,00" 
                                                                    className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                                    {...field} 
                                                                    onChange={e => field.onChange(e.target.value.replace('.', ',') )}
                                                                    min="0"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={control}
                                                    name={`batches.${batchIndex}.start_date`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel className="text-white">Data de Início das Vendas</FormLabel>
                                                            <DatePicker 
                                                                date={field.value} 
                                                                setDate={field.onChange} 
                                                                placeholder="Data de Início" 
                                                            />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={control}
                                                    name={`batches.${batchIndex}.end_date`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel className="text-white">Data de Término das Vendas</FormLabel>
                                                            <DatePicker 
                                                                date={field.value} 
                                                                setDate={field.onChange} 
                                                                placeholder="Data de Término" 
                                                            />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                    
                                    {errors.batches && (
                                        <p className="text-red-500 text-sm mt-2">Houve um erro na configuração dos lotes. Verifique todos os campos.</p>
                                    )}
                                    
                                    {/* Exibe o campo de preço único se não houver lotes configurados */}
                                    {numBatches === 0 && (
                                        <FormField
                                            control={control}
                                            name="ticket_price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Preço do Ingresso (R$)</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            placeholder="Ex: 100,00" 
                                                            className="bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500"
                                                            {...field} 
                                                            onChange={e => field.onChange(e.target.value.replace('.', ','))}
                                                            min="0"
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-gray-500 text-xs">Preço individual de cada ingresso.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Botões de Navegação */}
                <div className="flex justify-between mt-8">
                    {currentStep > 1 && (
                        <Button 
                            type="button" 
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            variant="outline"
                            className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 py-2 text-base font-semibold transition-all duration-300 cursor-pointer"
                        >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Voltar
                        </Button>
                    )}
                    {currentStep < (activeContract ? 4 : 3) && (
                        <Button 
                            type="button" 
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            className="bg-yellow-500 text-black hover:bg-yellow-600 py-2 text-base font-semibold transition-all duration-300 cursor-pointer ml-auto"
                        >
                            Próximo
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    )}
                    {currentStep === (activeContract ? 4 : 3) && (
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-yellow-500 text-black hover:bg-yellow-600 py-2 text-base font-semibold transition-all duration-300 cursor-pointer ml-auto disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Salvando...
                                </div>
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" />
                                    Salvar Evento
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </form>
            
            {/* Modal de Confirmação para Sair (apenas se houver dados não salvos) */}
            <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <AlertDialogContent className="bg-black/90 border border-yellow-500/30 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-yellow-400">Descartar Alterações?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            Você tem alterações não salvas. Tem certeza que deseja sair e descartá-las?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => navigate('/manager/events')}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Descartar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </FormProvider>
    );
};

export default EventFormSteps;