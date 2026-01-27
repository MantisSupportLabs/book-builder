'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-mono text-xs uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-primary text-primary-foreground border border-primary hover:shadow-[0_0_15px_var(--amber-glow)] hover:border-primary',
            secondary: 'bg-secondary text-foreground border border-border hover:bg-muted hover:border-primary',
            ghost: 'bg-transparent text-muted-foreground border border-transparent hover:bg-secondary hover:text-foreground hover:border-border',
            destructive: 'bg-destructive text-destructive-foreground border border-destructive hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        };

        const sizes = {
            sm: 'h-8 px-3 text-[10px]',
            md: 'h-10 px-4',
            lg: 'h-12 px-6 text-sm',
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <span className="animate-pulse mr-2">●</span>
                        Processing...
                    </>
                ) : (
                    children
                )}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
