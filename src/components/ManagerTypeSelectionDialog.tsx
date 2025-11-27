"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Building, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManagerTypeSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectType: (type: 'individual' | 'company') => void;
    isSubmitting: boolean;
}

const ManagerTypeSelectionDialog: React.FC<ManagerTypeSelectionDialogProps> = ({
    isOpen,
    onClose,
    onSelectType,
    isSubmitting,
}) => {
    const [selectedType, setSelectedType] = useState<'individual' | 'company' | null>(null);

    const handleConfirm = () => {
        if (selectedType) {
            onSelectType(selectedType);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-black/90 border border-yellow-500/30 text-white p-6">
                <DialogHeader>
                    <DialogTitle className="text-yellow-500 text-2xl flex items-center">
                        <User className="h-6 w-6 mr-2" />
                        Tipo de Cadastro
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Selecione o tipo de registro para sua conta de gestor.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div 
                        className={cn(
                            "flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                            selectedType === 'individual' ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500/30 hover:border-yellow-500/60"
                        )}
                        onClick={() => setSelectedType('individual')}
                    >
                        <Checkbox 
                            checked={selectedType === 'individual'} 
                            onCheckedChange={() => setSelectedType('individual')}
                            className="border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                        />
                        <User className="h-5 w-5 text-yellow-500" />
                        <label htmlFor="individual" className="text-white font-medium text-base cursor-pointer">
                            Pessoa Física (Gestor Individual)
                        </label>
                    </div>
                    <div 
                        className={cn(
                            "flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                            selectedType === 'company' ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500/30 hover:border-yellow-500/60"
                        )}
                        onClick={() => setSelectedType('company')}
                    >
                        <Checkbox 
                            checked={selectedType === 'company'} 
                            onCheckedChange={() => setSelectedType('company')}
                            className="border-yellow-500 data-[state=checked]:bg-yellow-500 data-[state=checked]:text-black"
                        />
                        <Building className="h-5 w-5 text-yellow-500" />
                        <label htmlFor="company" className="text-white font-medium text-base cursor-pointer">
                            Pessoa Jurídica (Empresa)
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={handleConfirm}
                        disabled={!selectedType || isSubmitting}
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-600 py-3 text-base sm:text-lg font-semibold transition-all duration-300 cursor-pointer hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></Loader2>
                                <span>Confirmando...</span>
                            </div>
                        ) : (
                            'Confirmar Seleção'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ManagerTypeSelectionDialog;