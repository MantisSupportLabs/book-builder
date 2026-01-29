'use client';

import { cn } from '@/lib/utils';
import type { PromptPreset } from '@/lib/types';

interface ToneControlsProps {
    presets: PromptPreset[];
    selectedPresetId: string | null;
    onPresetChange: (presetId: string) => void;
    intensity: number;
    onIntensityChange: (value: number) => void;
}

/**
 * Tone controls with preset dropdown and intensity slider
 * Pure presentational component
 * Testable: Pass mock presets array
 */
export function ToneControls({
    presets,
    selectedPresetId,
    onPresetChange,
    intensity,
    onIntensityChange,
}: ToneControlsProps) {
    return (
        <div className="space-y-4 p-3 bg-secondary/50 border border-border">
            {/* Header */}
            <div className="text-xs font-mono uppercase tracking-wider text-accent">
                Tone Controls
            </div>

            {/* Preset dropdown */}
            <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                    Voice Preset
                </label>
                <select
                    value={selectedPresetId || ''}
                    onChange={(e) => onPresetChange(e.target.value)}
                    className={cn(
                        'w-full px-3 py-2 bg-background border border-border',
                        'text-sm focus:outline-none focus:border-primary',
                        'transition-colors'
                    )}
                >
                    <option value="">Select a preset...</option>
                    {presets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                            {preset.name} {preset.is_default && '(Default)'}
                        </option>
                    ))}
                </select>
            </div>

            {/* Intensity slider */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">
                        Intensity
                    </label>
                    <span className="text-xs font-mono text-primary">
                        {intensity}
                    </span>
                </div>
                <input
                    type="range"
                    min={1}
                    max={5}
                    value={intensity}
                    onChange={(e) => onIntensityChange(Number(e.target.value))}
                    className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtle</span>
                    <span>Intense</span>
                </div>
            </div>

            {/* Selected preset info */}
            {selectedPresetId && presets.find(p => p.id === selectedPresetId) && (
                <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                        Tone: {presets.find(p => p.id === selectedPresetId)?.tone || 'Neutral'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Pacing: {presets.find(p => p.id === selectedPresetId)?.pacing || 'Medium'}
                    </p>
                </div>
            )}
        </div>
    );
}
