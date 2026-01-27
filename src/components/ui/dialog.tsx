'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
                onClick={() => onOpenChange(false)}
            />
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                {children}
            </div>
        </div>
    );
}

interface DialogContentProps {
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
}

export function DialogContent({ children, className, onClose }: DialogContentProps) {
    return (
        <div
            className={cn(
                'relative bg-card border border-border shadow-2xl w-full max-w-lg max-h-[85vh] overflow-auto animate-scale-in',
                className
            )}
        >
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
            {children}
        </div>
    );
}

interface DialogHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
    return (
        <div className={cn('p-6 pb-0', className)}>
            {children}
        </div>
    );
}

interface DialogTitleProps {
    children: React.ReactNode;
    className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
    return (
        <h2 className={cn('text-lg font-semibold', className)}>
            {children}
        </h2>
    );
}

interface DialogDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
    return (
        <p className={cn('text-sm text-muted-foreground mt-1', className)}>
            {children}
        </p>
    );
}

interface DialogBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function DialogBody({ children, className }: DialogBodyProps) {
    return (
        <div className={cn('p-6', className)}>
            {children}
        </div>
    );
}

interface DialogFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
    return (
        <div className={cn('p-6 pt-0 flex items-center justify-end gap-3', className)}>
            {children}
        </div>
    );
}
