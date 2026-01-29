'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutlineFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onAIGenerate: () => Promise<void>;
    isGenerating: boolean;
    placeholder?: string;
    rows?: number;
}

/**
 * Single outline field with AI generate button
 * Pure presentational component
 * Testable: Mock onAIGenerate to test loading states
 */
export function OutlineField({
    label,
    value,
    onChange,
    onAIGenerate,
    isGenerating,
    placeholder = 'Enter content...',
    rows = 3,
}: OutlineFieldProps) {
    return (
        <div className="space-y-2">
            {/* Label with AI button */}
            <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {label}
                </label>
                <button
                    onClick={onAIGenerate}
                    disabled={isGenerating}
                    className={cn(
                        'flex items-center gap-1.5 px-2 py-1 text-xs font-mono rounded-sm transition-colors',
                        'text-accent hover:bg-accent/10 border border-transparent hover:border-accent/30',
                        isGenerating && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    {isGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Sparkles className="w-3 h-3" />
                    )}
                    {isGenerating ? 'Generating...' : 'AI Generate'}
                </button>
            </div>

            {/* Textarea */}
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                disabled={isGenerating}
                className={cn(
                    'w-full px-3 py-2 bg-secondary border border-border',
                    'text-sm resize-none focus:outline-none focus:border-primary',
                    'transition-colors placeholder:text-muted-foreground',
                    isGenerating && 'opacity-50'
                )}
            />
        </div>
    );
}
