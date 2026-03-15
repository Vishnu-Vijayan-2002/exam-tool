'use client';

import { useState } from 'react';
import { updateTargetPic, updateGlobalTargetPic } from '@/lib/actions';
import { Image as ImageIcon, Upload, Check, Loader2 } from 'lucide-react';

interface TargetPicUploadProps {
    sessionId?: number;
    initialPic?: string | null;
    isGlobal?: boolean;
}

export default function TargetPicUpload({ sessionId, initialPic, isGlobal }: TargetPicUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [preview, setPreview] = useState<string | null>(initialPic || null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const result = isGlobal 
                ? await updateGlobalTargetPic(base64)
                : await updateTargetPic(sessionId!, base64);
            
            if (result.success) {
                setPreview(base64);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                alert(result.error || 'Failed to update target picture');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {isGlobal && (
                <div className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wider">
                    Global Target Design:
                </div>
            )}
            <div className={`relative group ${isGlobal ? 'w-16 h-16' : 'w-10 h-10'}`}>
                {preview ? (
                    <img 
                        src={preview} 
                        alt="Target" 
                        className="w-full h-full rounded object-cover border border-white/10 group-hover:opacity-50 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full rounded bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500">
                        <ImageIcon className={isGlobal ? 'w-8 h-8' : 'w-5 h-5'} />
                    </div>
                )}
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    {uploading ? (
                        <Loader2 className={`${isGlobal ? 'w-6 h-6' : 'w-4 h-4'} animate-spin text-white`} />
                    ) : (
                        <Upload className={isGlobal ? 'w-6 h-6' : 'w-4 h-4'} text-white />
                    )}
                </label>
            </div>
            {showSuccess && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
        </div>
    );
}
