'use client';

import { useState } from 'react';
import { updateGlobalTargetHtml } from '@/lib/actions';
import { Code, Save, Check, Loader2 } from 'lucide-react';

interface TargetHtmlEditorProps {
    initialHtml?: string | null;
}

export default function TargetHtmlEditor({ initialHtml }: TargetHtmlEditorProps) {
    const [html, setHtml] = useState(initialHtml || '');
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateGlobalTargetHtml(html);
            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                alert(result.error || 'Failed to update target HTML');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 mt-6 p-6 bg-zinc-950/50 rounded-2xl border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Reference HTML Code</h3>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : (showSuccess ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />)}
                    {saving ? 'Saving...' : (showSuccess ? 'Saved' : 'Save Code')}
                </button>
            </div>
            
            <div className="relative group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-30"></div>
                <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    placeholder="Enter the reference HTML/CSS code that students should use or study..."
                    className="w-full h-48 bg-black/60 text-zinc-300 font-mono text-sm p-4 rounded-xl outline-none border border-white/5 focus:border-[var(--accent)]/50 transition-all resize-none shadow-inner"
                    spellCheck={false}
                />
            </div>
            <p className="text-[10px] text-zinc-500 italic">
                This code will be visible to students but they will not be able to edit it.
            </p>
        </div>
    );
}
