'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                        {label}
                    </label>
                )}
                <textarea
                    className={cn(
                        'flex min-h-[120px] w-full bg-input text-foreground border border-border px-4 py-3 text-base',
                        'placeholder:text-muted-foreground',
                        'focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_var(--primary)]',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'transition-all duration-200 resize-none',
                        error && 'border-destructive focus:border-destructive focus:shadow-[0_0_0_1px_var(--destructive)]',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-destructive mt-1 font-mono">[ERROR] {error}</p>
                )}
            </div>
        );
    }
);
Textarea.displayName = 'Textarea';

export { Textarea };
