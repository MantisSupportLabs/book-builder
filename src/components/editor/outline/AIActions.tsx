'use client';

import { Sparkles, Loader2, ArrowRight, ArrowUp, PenLine, Shrink } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface AIActionsProps {
    onExpand: () => void;
    onShorten: () => void;
    onRewrite: () => void;
    onContinue: () => void;
    isProcessing: boolean;
    activeAction: string | null;
}

/**
 * Quick AI action buttons for the editor
 * Pure presentational component
 * Testable: Pass mock handlers
 */
export function AIActions({
    onExpand,
    onShorten,
    onRewrite,
    onContinue,
    isProcessing,
    activeAction,
}: AIActionsProps) {
    const ActionButton = ({
        label,
        icon: Icon,
        onClick,
        actionKey,
    }: {
        label: string;
        icon: typeof Sparkles;
        onClick: () => void;
        actionKey: string;
    }) => (
        <Button
            variant="secondary"
            size="sm"
            onClick={onClick}
            disabled={isProcessing}
            className={cn(
                'text-xs',
                isProcessing && activeAction === actionKey && 'opacity-75'
            )}
        >
            {isProcessing && activeAction === actionKey ? (
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            ) : (
                <Icon className="w-3 h-3 mr-1.5" />
            )}
            {label}
        </Button>
    );

    return (
        <div className="border-t border-border p-3 bg-secondary/30">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono uppercase tracking-wider text-accent">
                    AI Actions
                </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <ActionButton
                    label="Expand"
                    icon={ArrowUp}
                    onClick={onExpand}
                    actionKey="expand"
                />
                <ActionButton
                    label="Shorten"
                    icon={Shrink}
                    onClick={onShorten}
                    actionKey="shorten"
                />
                <ActionButton
                    label="Rewrite"
                    icon={PenLine}
                    onClick={onRewrite}
                    actionKey="rewrite"
                />
                <ActionButton
                    label="Continue"
                    icon={ArrowRight}
                    onClick={onContinue}
                    actionKey="continue"
                />
            </div>
        </div>
    );
}
