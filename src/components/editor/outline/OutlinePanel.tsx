'use client';

import { Loader2 } from 'lucide-react';
import { OutlineField } from './OutlineField';
import { ToneControls } from './ToneControls';
import { useOutline, useTonePreset, useAIGenerate } from '../hooks';
import type { Book } from '@/lib/types';

interface OutlinePanelProps {
    bookId: string;
    nodeId: string;
    book?: Book | null;
    isFiction?: boolean;
}

/**
 * Right panel showing outline fields and tone controls
 * Uses hooks for data management
 * Testable: Mock the hooks
 */
export function OutlinePanel({ bookId, nodeId, book, isFiction = true }: OutlinePanelProps) {
    const { outline, isLoading, updateField, isSaving } = useOutline({ nodeId });
    const { presets, selectedPresetId, setSelectedPresetId, intensity, setIntensity } = useTonePreset({ bookId });
    const { generateField, isGenerating, generatingField } = useAIGenerate({ bookId, nodeId });

    const handleAIGenerate = async (field: string) => {
        try {
            const generated = await generateField({
                field,
                currentValue: outline?.[field as keyof typeof outline] as string,
                outline: outline || undefined,
                book: book || undefined,
                preset: presets.find(p => p.id === selectedPresetId) || undefined,
                intensity,
            });
            await updateField(field as keyof typeof outline, generated);
        } catch (err) {
            console.error('AI generation failed:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Field labels differ for fiction vs non-fiction
    const conflictLabel = isFiction ? 'Conflict' : 'Key Argument';
    const turningPointLabel = isFiction ? 'Turning Point' : 'Key Insight';

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Outline
                </span>
                {isSaving && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                    </span>
                )}
            </div>

            {/* Outline fields */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <OutlineField
                    label="Summary"
                    value={outline?.summary || ''}
                    onChange={(value) => updateField('summary', value)}
                    onAIGenerate={() => handleAIGenerate('summary')}
                    isGenerating={isGenerating && generatingField === 'summary'}
                    placeholder="What happens in this section..."
                />

                <OutlineField
                    label="Purpose"
                    value={outline?.purpose || ''}
                    onChange={(value) => updateField('purpose', value)}
                    onAIGenerate={() => handleAIGenerate('purpose')}
                    isGenerating={isGenerating && generatingField === 'purpose'}
                    placeholder="Why this section matters..."
                />

                <OutlineField
                    label={conflictLabel}
                    value={outline?.conflict_or_argument || ''}
                    onChange={(value) => updateField('conflict_or_argument', value)}
                    onAIGenerate={() => handleAIGenerate('conflict_or_argument')}
                    isGenerating={isGenerating && generatingField === 'conflict_or_argument'}
                    placeholder={isFiction ? 'Main tension or conflict...' : 'Central argument or point...'}
                />

                <OutlineField
                    label={turningPointLabel}
                    value={outline?.turning_point || ''}
                    onChange={(value) => updateField('turning_point', value)}
                    onAIGenerate={() => handleAIGenerate('turning_point')}
                    isGenerating={isGenerating && generatingField === 'turning_point'}
                    placeholder={isFiction ? 'Key moment or revelation...' : 'Key insight or conclusion...'}
                />

                <OutlineField
                    label="Key Characters"
                    value={outline?.key_characters || ''}
                    onChange={(value) => updateField('key_characters', value)}
                    onAIGenerate={() => handleAIGenerate('key_characters')}
                    isGenerating={isGenerating && generatingField === 'key_characters'}
                    placeholder="Characters appearing in this section..."
                    rows={2}
                />

                <OutlineField
                    label="Setting"
                    value={outline?.setting || ''}
                    onChange={(value) => updateField('setting', value)}
                    onAIGenerate={() => handleAIGenerate('setting')}
                    isGenerating={isGenerating && generatingField === 'setting'}
                    placeholder="Where this takes place..."
                    rows={2}
                />

                <OutlineField
                    label="Open Questions"
                    value={outline?.open_questions || ''}
                    onChange={(value) => updateField('open_questions', value)}
                    onAIGenerate={() => handleAIGenerate('open_questions')}
                    isGenerating={isGenerating && generatingField === 'open_questions'}
                    placeholder="Questions to address or leave unanswered..."
                    rows={2}
                />
            </div>

            {/* Tone controls at bottom */}
            <div className="border-t border-border">
                <ToneControls
                    presets={presets}
                    selectedPresetId={selectedPresetId}
                    onPresetChange={setSelectedPresetId}
                    intensity={intensity}
                    onIntensityChange={setIntensity}
                />
            </div>
        </div>
    );
}
