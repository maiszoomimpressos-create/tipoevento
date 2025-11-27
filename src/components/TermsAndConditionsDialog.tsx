"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MultiLineEditor from './MultiLineEditor'; // Importa o MultiLineEditor
import { FileText } from 'lucide-react';

interface TermsAndConditionsDialogProps {
    onAgree: (agreed: boolean) => void;
    initialAgreedState?: boolean;
    showAgreementCheckbox?: boolean; 
    termsType?: 'general' | 'manager_registration'; // Novo: Tipo de termos a serem carregados
}

const TermsAndConditionsDialog: React.FC<TermsAndConditionsDialogProps> = ({ 
    onAgree, 
    initialAgreedState = false,
    showAgreementCheckbox = true,
    termsType = 'general' // Valor padrão
}) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [agreedInternally, setAgreedInternally] = useState(initialAgreedState);

    const handleAgreeChange = (agreed: boolean) => {
        setAgreedInternally(agreed);
        onAgree(agreed);
    };
    
    const dialogTitle = termsType === 'general' ? 'Termos e Condições de Uso' : 'Termos de Registro de Gestor';

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm h-9 px-4"
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Termos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-black/90 border border-yellow-500/30 text-white p-6">
                <DialogHeader>
                    <DialogTitle className="text-yellow-500 text-2xl flex items-center">
                        <FileText className="h-6 w-6 mr-2" />
                        {dialogTitle}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Leia atentamente nossos termos antes de prosseguir.
                    </DialogDescription>
                </DialogHeader>
                {/* Renderiza o MultiLineEditor dentro do Dialog */}
                <MultiLineEditor 
                    onAgree={handleAgreeChange} 
                    initialAgreedState={agreedInternally}
                    showAgreementCheckbox={showAgreementCheckbox} 
                    termsType={termsType} // Passa o tipo de termos
                />
            </DialogContent>
        </Dialog>
    );
};

export default TermsAndConditionsDialog;