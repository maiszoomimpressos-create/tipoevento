import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { showError } from "@/utils/toast";

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
}

// Função para formatar a data para DD/MM/YYYY enquanto o usuário digita
const formatInputDate = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    let formatted = cleanValue;

    if (cleanValue.length > 2) {
        formatted = cleanValue.substring(0, 2) + '/' + cleanValue.substring(2);
    }
    if (cleanValue.length > 4) {
        formatted = formatted.substring(0, 5) + '/' + cleanValue.substring(4);
    }
    return formatted.substring(0, 10);
};

export function DatePicker({ date, setDate, placeholder = "Selecione a data", disabled = false }: DatePickerProps) {
    const [inputValue, setInputValue] = React.useState(date ? format(date, "dd/MM/yyyy") : '');
    const [open, setOpen] = React.useState(false);

    // Sincroniza o estado interno do input com a prop 'date'
    React.useEffect(() => {
        if (date && format(date, "dd/MM/yyyy") !== inputValue) {
            setInputValue(format(date, "dd/MM/yyyy"));
        } else if (!date && inputValue !== '') {
            setInputValue('');
        }
    }, [date]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formattedDate = formatInputDate(rawValue);
        setInputValue(formattedDate);

        if (formattedDate.length === 10) {
            const parsedDate = parse(formattedDate, 'dd/MM/yyyy', new Date());
            if (isValid(parsedDate)) {
                setDate(parsedDate);
            } else {
                setDate(undefined);
                showError("Formato de data inválido. Use DD/MM/YYYY.");
            }
        } else if (formattedDate.length < 10) {
            setDate(undefined);
        }
    };

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate) {
            setInputValue(format(selectedDate, "dd/MM/yyyy"));
            // Fecha o popover automaticamente após selecionar uma data
            setOpen(false);
        } else {
            setInputValue('');
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-full">
                    <Input
                        type="text"
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={handleInputChange}
                        disabled={disabled}
                        maxLength={10}
                        className={cn(
                            "w-full justify-start text-left font-normal bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 hover:bg-black/70 pr-10",
                            !date && inputValue.length === 10 && "border-red-500", // Destaca se a data digitada for inválida
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-500 cursor-pointer pointer-events-none" />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-black/90 border border-yellow-500/30 text-white" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={ptBR}
                    className="bg-black/90"
                    classNames={{
                        day_selected: "bg-yellow-500 text-black hover:bg-yellow-600 hover:text-black focus:bg-yellow-500 focus:text-black",
                        day_today: "bg-yellow-500/20 text-yellow-500",
                        day_hover: "bg-yellow-500/10",
                        caption_label: "text-white",
                        nav_button_previous: "text-yellow-500 hover:bg-yellow-500/10",
                        nav_button_next: "text-yellow-500 hover:bg-yellow-500/10",
                        head_cell: "text-gray-400",
                        day: "text-white",
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}