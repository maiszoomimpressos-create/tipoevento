import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function DatePicker({ date, setDate, placeholder = "Selecione a data", disabled = false }: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-black/60 border-yellow-500/30 text-white placeholder-gray-500 focus:border-yellow-500 hover:bg-black/70",
                        !date && "text-gray-500",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-yellow-500" />
                    {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-black/90 border border-yellow-500/30 text-white">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ptBR} // Usando locale ptBR para o calendário
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