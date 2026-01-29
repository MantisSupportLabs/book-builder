'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Select, Slider, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui';
import {
    ChevronLeft,
    BookOpen,
    Plus,
    Trash2,
    Edit2,
    Copy,
    Star,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    TONES,
    PACING_OPTIONS,
    VOICE_TRAIT_LABELS,
    type PromptPreset,
    type VoiceTraits,
} from '@/lib/types';

export default function PresetsPage() {
    const params = useParams();
    const supabase = createClient();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<{ title: string } | null>(null);
    const [presets, setPresets] = useState<PromptPreset[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<PromptPreset | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingPreset, setEditingPreset] = useState<Partial<PromptPreset>>({});
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);

        const { data: bookData } = await supabase
            .from('books')
            .select('title')
            .eq('id', bookId)
            .single();

        setBook(bookData);

        const { data: presetsData } = await supabase
            .from('prompt_presets')
            .select('*')
            .eq('book_id', bookId)
            .order('created_at', { ascending: true });

        setPresets(presetsData || []);

        // Select default or first preset
        const defaultPreset = presetsData?.find(p => p.is_default);
        setSelectedPreset(defaultPreset || presetsData?.[0] || null);

        setIsLoading(false);
    }, [bookId, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openCreateDialog = () => {
        setEditingPreset({
            name: '',
            tone: 'Neutral',
            tone_intensity: 3,
            pacing: 'medium',
            voice_traits: {
                concise: 3,
                literary: 3,
                formal: 3,
                gritty: 1,
                poetic: 2,
                humorous: 2,
                dramatic: 3,
                minimalist: 2,
            },
            intent_tag: '',
            do_rules: '',
            dont_rules: '',
        });
        setIsCreating(true);
    };

    const openEditDialog = (preset: PromptPreset) => {
        setEditingPreset({ ...preset });
        setIsEditing(true);
    };

    const savePreset = async () => {
        if (!editingPreset.name?.trim()) return;

        if (isCreating) {
            const { data, error } = await supabase
                .from('prompt_presets')
                .insert({
                    book_id: bookId,
                    name: editingPreset.name,
                    tone: editingPreset.tone,
                    tone_intensity: editingPreset.tone_intensity,
                    pacing: editingPreset.pacing,
                    voice_traits: editingPreset.voice_traits,
                    intent_tag: editingPreset.intent_tag || null,
                    do_rules: editingPreset.do_rules || null,
                    dont_rules: editingPreset.dont_rules || null,
                    is_default: false,
                })
                .select()
                .single();

            if (!error && data) {
                setPresets(prev => [...prev, data]);
                setSelectedPreset(data);
            }
        } else if (isEditing && editingPreset.id) {
            const { error } = await supabase
                .from('prompt_presets')
                .update({
                    name: editingPreset.name,
                    tone: editingPreset.tone,
                    tone_intensity: editingPreset.tone_intensity,
                    pacing: editingPreset.pacing,
                    voice_traits: editingPreset.voice_traits,
                    intent_tag: editingPreset.intent_tag || null,
                    do_rules: editingPreset.do_rules || null,
                    dont_rules: editingPreset.dont_rules || null,
                })
                .eq('id', editingPreset.id);

            if (!error) {
                setPresets(prev => prev.map(p =>
                    p.id === editingPreset.id ? { ...p, ...editingPreset } as PromptPreset : p
                ));
                setSelectedPreset(prev =>
                    prev?.id === editingPreset.id ? { ...prev, ...editingPreset } as PromptPreset : prev
                );
            }
        }

        setIsCreating(false);
        setIsEditing(false);
    };

    const deletePreset = async (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset?.is_default) return; // Can't delete default

        await supabase.from('prompt_presets').delete().eq('id', presetId);
        setPresets(prev => prev.filter(p => p.id !== presetId));

        if (selectedPreset?.id === presetId) {
            setSelectedPreset(presets.find(p => p.id !== presetId) || null);
        }
    };

    const setAsDefault = async (presetId: string) => {
        // Remove default from all
        await supabase
            .from('prompt_presets')
            .update({ is_default: false })
            .eq('book_id', bookId);

        // Set new default
        await supabase
            .from('prompt_presets')
            .update({ is_default: true })
            .eq('id', presetId);

        setPresets(prev => prev.map(p => ({
            ...p,
            is_default: p.id === presetId
        })));
    };

    const duplicatePreset = async (preset: PromptPreset) => {
        const { data, error } = await supabase
            .from('prompt_presets')
            .insert({
                book_id: bookId,
                name: `${preset.name} (Copy)`,
                tone: preset.tone,
                tone_intensity: preset.tone_intensity,
                pacing: preset.pacing,
                voice_traits: preset.voice_traits,
                intent_tag: preset.intent_tag,
                do_rules: preset.do_rules,
                dont_rules: preset.dont_rules,
                is_default: false,
            })
            .select()
            .single();

        if (!error && data) {
            setPresets(prev => [...prev, data]);
        }
    };

    const updateEditingField = <K extends keyof PromptPreset>(key: K, value: PromptPreset[K]) => {
        setEditingPreset(prev => ({ ...prev, [key]: value }));
    };

    const updateVoiceTrait = (trait: keyof VoiceTraits, value: number) => {
        setEditingPreset(prev => ({
            ...prev,
            voice_traits: { ...(prev.voice_traits as VoiceTraits), [trait]: value },
        }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="font-mono text-muted-foreground animate-pulse">
                    LOADING PRESETS...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/books/${bookId}/structure`} className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <span className="font-medium">{book?.title}</span>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1">
                        <Link href={`/books/${bookId}/structure`}>
                            <Button variant="ghost" size="sm">Structure</Button>
                        </Link>
                        <Link href={`/books/${bookId}/presets`}>
                            <Button variant="primary" size="sm">Presets</Button>
                        </Link>
                        <Link href={`/books/${bookId}/notes`}>
                            <Button variant="ghost" size="sm">Notes</Button>
                        </Link>
                        <Link href={`/books/${bookId}/export`}>
                            <Button variant="ghost" size="sm">Export</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <div className="flex min-h-[calc(100vh-3.5rem)]">
                {/* Left sidebar - Preset list */}
                <aside className="w-72 border-r border-border flex flex-col">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            Prompt Presets
                        </h2>
                        <Button variant="ghost" size="sm" onClick={openCreateDialog}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {presets.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No presets yet
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {presets.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setSelectedPreset(preset)}
                                        className={cn(
                                            'w-full text-left p-3 border transition-all',
                                            selectedPreset?.id === preset.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-transparent hover:bg-secondary'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {preset.is_default && (
                                                <Star className="w-3 h-3 text-primary fill-primary" />
                                            )}
                                            <span className="font-medium truncate">{preset.name}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {preset.tone} · {preset.pacing}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right panel - Preset details */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {selectedPreset ? (
                        <PresetDetails
                            preset={selectedPreset}
                            onEdit={() => openEditDialog(selectedPreset)}
                            onDuplicate={() => duplicatePreset(selectedPreset)}
                            onDelete={() => deletePreset(selectedPreset.id)}
                            onSetDefault={() => setAsDefault(selectedPreset.id)}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <p className="mb-4">No preset selected</p>
                                <Button onClick={openCreateDialog}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Preset
                                </Button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isCreating || isEditing} onOpenChange={() => { setIsCreating(false); setIsEditing(false); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isCreating ? 'Create Preset' : 'Edit Preset'}</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="space-y-6">
                        <Input
                            label="Name"
                            value={editingPreset.name || ''}
                            onChange={(e) => updateEditingField('name', e.target.value)}
                            placeholder="e.g., Action Scenes"
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <Select
                                label="Base Tone"
                                options={TONES.map(t => ({ value: t, label: t }))}
                                value={editingPreset.tone || 'Neutral'}
                                onChange={(v) => updateEditingField('tone', v)}
                            />
                            <Select
                                label="Pacing"
                                options={PACING_OPTIONS.map(o => ({ value: o.value || '', label: o.label }))}
                                value={editingPreset.pacing || 'medium'}
                                onChange={(v) => updateEditingField('pacing', v as 'slow' | 'medium' | 'fast')}
                            />
                        </div>

                        <Slider
                            label="Tone Intensity"
                            value={editingPreset.tone_intensity || 3}
                            onChange={(v) => updateEditingField('tone_intensity', v)}
                            min={1}
                            max={5}
                            step={1}
                            showValue
                        />

                        <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                                Voice Traits
                            </label>
                            <div className="grid gap-3 md:grid-cols-2">
                                {(Object.keys(VOICE_TRAIT_LABELS) as Array<keyof VoiceTraits>).map((trait) => (
                                    <Slider
                                        key={trait}
                                        label={VOICE_TRAIT_LABELS[trait]}
                                        value={(editingPreset.voice_traits as VoiceTraits)?.[trait] || 1}
                                        onChange={(v) => updateVoiceTrait(trait, v)}
                                        min={1}
                                        max={5}
                                        step={1}
                                    />
                                ))}
                            </div>
                        </div>

                        <Input
                            label="Intent Tag (optional)"
                            value={editingPreset.intent_tag || ''}
                            onChange={(e) => updateEditingField('intent_tag', e.target.value)}
                            placeholder="e.g., reveal, build tension, introduce character"
                        />

                        <Input
                            label="Do Rules (optional)"
                            value={editingPreset.do_rules || ''}
                            onChange={(e) => updateEditingField('do_rules', e.target.value)}
                            placeholder="e.g., Use short sentences, Include sensory details"
                        />

                        <Input
                            label="Don't Rules (optional)"
                            value={editingPreset.dont_rules || ''}
                            onChange={(e) => updateEditingField('dont_rules', e.target.value)}
                            placeholder="e.g., Don't use adverbs, Avoid passive voice"
                        />
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setIsCreating(false); setIsEditing(false); }}>
                            Cancel
                        </Button>
                        <Button onClick={savePreset}>
                            {isCreating ? 'Create' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function PresetDetails({
    preset,
    onEdit,
    onDuplicate,
    onDelete,
    onSetDefault,
}: {
    preset: PromptPreset;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onSetDefault: () => void;
}) {
    const voiceTraits = preset.voice_traits as VoiceTraits | null;

    return (
        <div className="max-w-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2">
                        {preset.is_default && (
                            <span className="text-xs font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-1">
                                Default
                            </span>
                        )}
                    </div>
                    <h1 className="text-2xl font-semibold mt-2">{preset.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {!preset.is_default && (
                        <Button variant="ghost" size="sm" onClick={onSetDefault}>
                            <Star className="w-4 h-4 mr-2" />
                            Set as Default
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onDuplicate}>
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onEdit}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    {!preset.is_default && (
                        <Button variant="ghost" size="sm" onClick={onDelete}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Settings display */}
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-card border border-border p-4">
                        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                            Tone
                        </div>
                        <div className="font-medium">{preset.tone || 'Neutral'}</div>
                    </div>
                    <div className="bg-card border border-border p-4">
                        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                            Intensity
                        </div>
                        <div className="font-medium">{preset.tone_intensity || 3}/5</div>
                    </div>
                    <div className="bg-card border border-border p-4">
                        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                            Pacing
                        </div>
                        <div className="font-medium capitalize">{preset.pacing || 'Medium'}</div>
                    </div>
                </div>

                {voiceTraits && (
                    <div className="bg-card border border-border p-4">
                        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
                            Voice Traits
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            {(Object.keys(VOICE_TRAIT_LABELS) as Array<keyof VoiceTraits>).map((trait) => (
                                <div key={trait} className="flex items-center justify-between">
                                    <span className="text-sm">{VOICE_TRAIT_LABELS[trait]}</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(level => (
                                            <div
                                                key={level}
                                                className={cn(
                                                    'w-3 h-3 border',
                                                    level <= (voiceTraits[trait] || 1)
                                                        ? 'bg-primary border-primary'
                                                        : 'border-border'
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(preset.intent_tag || preset.do_rules || preset.dont_rules) && (
                    <div className="bg-card border border-border p-4 space-y-4">
                        {preset.intent_tag && (
                            <div>
                                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                                    Intent Tag
                                </div>
                                <div className="text-sm">{preset.intent_tag}</div>
                            </div>
                        )}
                        {preset.do_rules && (
                            <div>
                                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                                    Do Rules
                                </div>
                                <div className="text-sm">{preset.do_rules}</div>
                            </div>
                        )}
                        {preset.dont_rules && (
                            <div>
                                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                                    Don&apos;t Rules
                                </div>
                                <div className="text-sm">{preset.dont_rules}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
