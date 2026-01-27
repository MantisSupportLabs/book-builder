'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    className?: string;
    disabled?: boolean;
}

export function Select({
    options,
    value,
    onChange,
    label,
    placeholder = 'Select...',
    error,
    className,
    disabled,
}: SelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn('w-full', className)} ref={containerRef}>
            {label && (
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    className={cn(
                        'flex h-10 w-full items-center justify-between bg-input text-foreground border border-border px-4 py-2 text-left',
                        'focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_var(--primary)]',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'transition-all duration-200',
                        error && 'border-destructive',
                        isOpen && 'border-primary'
                    )}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    <span className={cn(!selectedOption && 'text-muted-foreground')}>
                        {selectedOption?.label || placeholder}
                    </span>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform duration-200',
                            isOpen && 'rotate-180'
                        )}
                    />
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-lg max-h-60 overflow-auto animate-scale-in">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={cn(
                                    'w-full px-4 py-2 text-left text-sm transition-colors duration-150',
                                    'hover:bg-secondary hover:text-primary',
                                    option.value === value && 'bg-secondary text-primary'
                                )}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-xs text-destructive mt-1 font-mono">[ERROR] {error}</p>
            )}
        </div>
    );
}
