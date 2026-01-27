'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
    value: number;
    max?: number;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md';
    showLabel?: boolean;
    className?: string;
}

export function ProgressBar({
    value,
    max = 100,
    variant = 'default',
    size = 'sm',
    showLabel = false,
    className,
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
        default: 'bg-primary',
        success: 'bg-success',
        warning: 'bg-warning',
        danger: 'bg-destructive',
    };

    const sizes = {
        sm: 'h-1',
        md: 'h-2',
    };

    return (
        <div className={cn('w-full', className)}>
            {showLabel && (
                <div className="flex justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">Progress</span>
                    <span className="text-xs font-mono text-primary">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={cn('w-full bg-secondary border border-border overflow-hidden', sizes[size])}>
                <div
                    className={cn('h-full transition-all duration-300', variants[variant])}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
