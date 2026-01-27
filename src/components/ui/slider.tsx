'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    showValue?: boolean;
    className?: string;
    disabled?: boolean;
}

export function Slider({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = true,
    className,
    disabled,
}: SliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={cn('w-full', className)}>
            {(label || showValue) && (
                <div className="flex items-center justify-between mb-2">
                    {label && (
                        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            {label}
                        </label>
                    )}
                    {showValue && (
                        <span className="text-xs font-mono text-primary">{value}</span>
                    )}
                </div>
            )}
            <div className="relative h-2 bg-secondary border border-border">
                <div
                    className="absolute h-full bg-primary transition-all duration-150"
                    style={{ width: `${percentage}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    className={cn(
                        'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
                        disabled && 'cursor-not-allowed'
                    )}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-background transition-all duration-150"
                    style={{ left: `calc(${percentage}% - 8px)` }}
                />
            </div>
        </div>
    );
}
