import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
        return 'just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
        return formatDate(date);
    }
}

/**
 * Count words in a string
 */
export function countWords(text: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Format word count with commas
 */
export function formatWordCount(count: number): string {
    return count.toLocaleString();
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Truncate text to a max length
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}

/**
 * Debounce a function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Generate default part titles
 */
export function getDefaultPartTitle(index: number): string {
    const titles = ['Part One', 'Part Two', 'Part Three', 'Part Four'];
    return titles[index] || `Part ${index + 1}`;
}

/**
 * Generate a default chapter title
 */
export function getDefaultChapterTitle(index: number): string {
    return `Chapter ${index + 1}`;
}

/**
 * Get node type label
 */
export function getNodeTypeLabel(type: 'part' | 'chapter' | 'subchapter'): string {
    const labels = {
        part: 'Part',
        chapter: 'Chapter',
        subchapter: 'Subchapter',
    };
    return labels[type];
}

/**
 * Get status from outline and draft
 */
export function getNodeStatus(
    hasOutline: boolean,
    hasDraft: boolean
): 'empty' | 'outlined' | 'drafted' {
    if (hasDraft) return 'drafted';
    if (hasOutline) return 'outlined';
    return 'empty';
}

/**
 * Get status color class
 */
export function getStatusColorClass(status: 'empty' | 'outlined' | 'drafted'): string {
    const colors = {
        empty: 'bg-muted-foreground',
        outlined: 'bg-warning',
        drafted: 'bg-success',
    };
    return colors[status];
}

/**
 * Convert voice traits to descriptive text for AI prompts
 */
export function voiceTraitsToText(traits: Record<string, number>): string {
    const descriptions: string[] = [];

    const traitDescriptions: Record<string, (level: number) => string> = {
        concise: (l) => l >= 3 ? 'Write concisely with minimal flourish' : '',
        literary: (l) => l >= 3 ? 'Use rich, literary language' : '',
        formal: (l) => l >= 3 ? 'Maintain a formal tone' : l <= 2 ? 'Use casual, conversational language' : '',
        gritty: (l) => l >= 3 ? 'Include gritty, raw details' : '',
        poetic: (l) => l >= 3 ? 'Incorporate poetic elements and rhythm' : '',
        humorous: (l) => l >= 3 ? 'Include wit and humor where appropriate' : '',
        dramatic: (l) => l >= 3 ? 'Heighten dramatic tension' : '',
        minimalist: (l) => l >= 3 ? 'Use sparse, minimalist prose' : '',
    };

    for (const [trait, level] of Object.entries(traits)) {
        if (level && traitDescriptions[trait]) {
            const desc = traitDescriptions[trait](level);
            if (desc) descriptions.push(desc);
        }
    }

    return descriptions.join('. ');
}

/**
 * Get relative tone description
 */
export function getRelativeToneDescription(delta: number): string {
    if (delta === 0) return 'Match the previous chapter tone';

    const intensity = Math.abs(delta);
    const direction = delta > 0 ? 'more intense' : 'less intense';
    const amount = intensity === 1 ? 'slightly' : intensity === 2 ? 'notably' : 'significantly';

    return `Make this chapter ${amount} ${direction} than the previous`;
}
