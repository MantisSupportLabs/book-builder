'use client';

import { useState } from 'react';
import { Users, MapPin, Settings, Calendar, Loader2 } from 'lucide-react';
import { ArtifactSection } from './ArtifactSection';
import { useArtifacts } from '../hooks';
import type { Note } from '@/lib/types';

interface ArtifactsPanelProps {
    bookId: string;
    onSelectArtifact?: (artifact: Note) => void;
}

/**
 * Left panel showing book artifacts (characters, locations, settings, timeline)
 * Uses useArtifacts hook to fetch data
 * Testable: Mock useArtifacts hook
 */
export function ArtifactsPanel({ bookId, onSelectArtifact }: ArtifactsPanelProps) {
    const { characters, locations, settings, timeline, isLoading, error } = useArtifacts({ bookId });

    // Track which sections are expanded
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        characters: true,
        locations: true,
        settings: false,
        timeline: false,
    });

    const toggleSection = (section: string) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-sm text-destructive">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-3 py-2 border-b border-border">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Artifacts
                </span>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto">
                <ArtifactSection
                    title="Characters"
                    icon={Users}
                    items={characters}
                    isExpanded={expanded.characters}
                    onToggle={() => toggleSection('characters')}
                    onItemClick={onSelectArtifact}
                />
                <ArtifactSection
                    title="Locations"
                    icon={MapPin}
                    items={locations}
                    isExpanded={expanded.locations}
                    onToggle={() => toggleSection('locations')}
                    onItemClick={onSelectArtifact}
                />
                <ArtifactSection
                    title="Settings"
                    icon={Settings}
                    items={settings}
                    isExpanded={expanded.settings}
                    onToggle={() => toggleSection('settings')}
                    onItemClick={onSelectArtifact}
                />
                <ArtifactSection
                    title="Timeline"
                    icon={Calendar}
                    items={timeline}
                    isExpanded={expanded.timeline}
                    onToggle={() => toggleSection('timeline')}
                    onItemClick={onSelectArtifact}
                />
            </div>
        </div>
    );
}
