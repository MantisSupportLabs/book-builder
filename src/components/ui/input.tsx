'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    mono?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, mono, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        'flex h-10 w-full bg-input text-foreground border border-border px-4 py-2 text-base',
                        'placeholder:text-muted-foreground',
                        'focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_var(--primary)]',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'transition-all duration-200',
                        mono && 'font-mono',
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
Input.displayName = 'Input';

export { Input };
