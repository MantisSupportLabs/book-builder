'use client';

import { ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/types';

interface ArtifactSectionProps {
    title: string;
    icon: LucideIcon;
    items: Note[];
    isExpanded: boolean;
    onToggle: () => void;
    onItemClick?: (item: Note) => void;
}

/**
 * Collapsible section for displaying artifacts
 * Pure presentational component - no data fetching
 * Testable: Pass mock items array
 */
export function ArtifactSection({
    title,
    icon: Icon,
    items,
    isExpanded,
    onToggle,
    onItemClick,
}: ArtifactSectionProps) {
    return (
        <div className="border-b border-border last:border-b-0">
            {/* Section header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary transition-colors"
            >
                <ChevronRight
                    className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-90'
                    )}
                />
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono uppercase tracking-wider flex-1 text-left">
                    {title}
                </span>
                <span className="text-xs text-muted-foreground">
                    {items.length}
                </span>
            </button>

            {/* Section items */}
            {isExpanded && (
                <div className="pb-2">
                    {items.length === 0 ? (
                        <p className="px-9 py-2 text-xs text-muted-foreground italic">
                            No {title.toLowerCase()} yet
                        </p>
                    ) : (
                        items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onItemClick?.(item)}
                                className="w-full px-9 py-1.5 text-left text-sm hover:bg-secondary/50 transition-colors truncate"
                            >
                                {item.title}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
