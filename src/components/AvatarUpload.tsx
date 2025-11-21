import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface AvatarUploadProps {
    userId: string;
    url: string | null;
    onUpload: (url: string) => void;
    initials: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, url, onUpload, initials }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showError("O arquivo é muito grande. Máximo de 5MB.");
            return;
        }

        const toastId = showLoading("Enviando foto...");
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // 1. Upload the file to Supabase Storage
            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('avatars') // Assuming you have a bucket named 'avatars'
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            // 2. Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            const publicUrl = publicUrlData.publicUrl;

            // 3. Update the user's profile in the 'profiles' table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (updateError) {
                // If profile update fails, try to delete the uploaded file
                await supabase.storage.from('avatars').remove([filePath]);
                throw updateError;
            }

            // 4. Success: Notify parent component and show toast
            onUpload(publicUrl);
            showSuccess("Foto de perfil atualizada com sucesso!");

            // Optional: Clean up old avatar if necessary (more complex logic needed for production)
            // For simplicity, we skip old file deletion here.

        } catch (error: any) {
            console.error('Upload failed:', error);
            showError(`Falha no upload: ${error.message || 'Erro desconhecido'}`);
        } finally {
            dismissToast(toastId);
            setUploading(false);
            // Reset file input to allow re-uploading the same file if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24 border-2 border-yellow-500/50">
                <AvatarImage src={url || undefined} alt="Avatar do Usuário" />
                <AvatarFallback className="bg-yellow-500 text-black font-bold text-4xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    disabled={uploading}
                />
                <Button 
                    onClick={handleButtonClick}
                    variant="outline" 
                    className="mt-2 bg-black/60 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-sm h-8"
                    disabled={uploading}
                >
                    {uploading ? 'Enviando...' : 'Alterar Foto'}
                </Button>
                <p className="text-gray-500 text-xs mt-1">JPG, PNG ou GIF (máx. 5MB)</p>
            </div>
        </div>
    );
};

export default AvatarUpload;