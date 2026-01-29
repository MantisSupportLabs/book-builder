'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea, Select, Slider } from '@/components/ui';
import { ChevronLeft, ChevronRight, BookOpen, Check } from 'lucide-react';
import { cn, getDefaultPartTitle } from '@/lib/utils';
import {
    GENRES,
    POV_OPTIONS,
    TENSE_OPTIONS,
    PACING_OPTIONS,
    TONES,
    VOICE_TRAIT_LABELS,
    type BookWizardData,
    type VoiceTraits,
} from '@/lib/types';

const STEPS = [
    { id: 1, title: 'Basic Info', description: 'Title and genre' },
    { id: 2, title: 'Writing Details', description: 'POV, tense, and audience' },
    { id: 3, title: 'Story Foundation', description: 'Premise and style' },
    { id: 4, title: 'Default Presets', description: 'Tone and voice' },
];

const DEFAULT_DATA: BookWizardData = {
    title: '',
    is_fiction: true,
    genre: '',
    pov: null,
    tense: null,
    audience: '',
    target_word_count: null,
    premise: '',
    style_notes: '',
    default_tone: 'Neutral',
    tone_intensity: 3,
    default_pacing: 'medium',
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
};

export default function NewBookPage() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [data, setData] = useState<BookWizardData>(DEFAULT_DATA);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateData = <K extends keyof BookWizardData>(key: K, value: BookWizardData[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const updateVoiceTrait = (trait: keyof VoiceTraits, value: number) => {
        setData((prev) => ({
            ...prev,
            voice_traits: { ...prev.voice_traits, [trait]: value },
        }));
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return data.title.trim().length > 0;
            case 2:
                return true; // All optional
            case 3:
                return true; // All optional
            case 4:
                return true;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        } else {
            handleCreate();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleCreate = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            // TESTING MODE: Use test user UUID if not authenticated
            const userId = user?.id || '00000000-0000-0000-0000-000000000000';

            // Create the book
            const { data: book, error: bookError } = await supabase
                .from('books')
                .insert({
                    user_id: userId,
                    title: data.title,
                    is_fiction: data.is_fiction,
                    genre: data.genre || null,
                    target_word_count: data.target_word_count,
                    pov: data.pov,
                    tense: data.tense,
                    audience: data.audience || null,
                    style_notes: data.style_notes || null,
                    premise: data.premise || null,
                })
                .select()
                .single();

            if (bookError || !book) {
                throw new Error(bookError?.message || 'Failed to create book');
            }

            // Create 4 parts
            const parts = [];
            for (let i = 0; i < 4; i++) {
                parts.push({
                    book_id: book.id,
                    parent_id: null,
                    node_type: 'part',
                    title: getDefaultPartTitle(i),
                    sort_order: i,
                });
            }

            const { error: partsError } = await supabase
                .from('structure_nodes')
                .insert(parts);

            if (partsError) {
                console.error('Error creating parts:', partsError);
            }

            // Create default preset
            const { error: presetError } = await supabase
                .from('prompt_presets')
                .insert({
                    book_id: book.id,
                    name: 'Default Style',
                    tone: data.default_tone,
                    tone_intensity: data.tone_intensity,
                    voice_traits: data.voice_traits,
                    pacing: data.default_pacing,
                    is_default: true,
                });

            if (presetError) {
                console.error('Error creating preset:', presetError);
            }

            // Navigate to the structure page
            router.push(`/books/${book.id}/structure`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm">Cancel</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <span className="font-mono text-sm uppercase tracking-wider">New Book</span>
                    </div>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Progress steps */}
            <div className="border-b border-border">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {STEPS.map((s, i) => (
                            <div key={s.id} className="flex items-center">
                                <button
                                    onClick={() => s.id < step && setStep(s.id)}
                                    disabled={s.id > step}
                                    className={cn(
                                        'flex items-center gap-3 transition-all',
                                        s.id < step && 'cursor-pointer',
                                        s.id > step && 'opacity-50'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'w-8 h-8 flex items-center justify-center border transition-all',
                                            s.id === step && 'border-primary bg-primary text-primary-foreground',
                                            s.id < step && 'border-success bg-success text-success-foreground',
                                            s.id > step && 'border-border text-muted-foreground'
                                        )}
                                    >
                                        {s.id < step ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <span className="font-mono text-sm">{s.id}</span>
                                        )}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <div className={cn(
                                            'text-sm font-medium',
                                            s.id === step && 'text-primary',
                                            s.id !== step && 'text-muted-foreground'
                                        )}>
                                            {s.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{s.description}</div>
                                    </div>
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className={cn(
                                        'w-8 md:w-16 h-px mx-2',
                                        s.id < step ? 'bg-success' : 'bg-border'
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Form content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive text-sm font-mono animate-slide-up">
                        [ERROR] {error}
                    </div>
                )}

                <div className="animate-slide-up" key={step}>
                    {step === 1 && (
                        <Step1
                            data={data}
                            updateData={updateData}
                        />
                    )}
                    {step === 2 && (
                        <Step2
                            data={data}
                            updateData={updateData}
                        />
                    )}
                    {step === 3 && (
                        <Step3
                            data={data}
                            updateData={updateData}
                        />
                    )}
                    {step === 4 && (
                        <Step4
                            data={data}
                            updateData={updateData}
                            updateVoiceTrait={updateVoiceTrait}
                        />
                    )}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!canProceed()}
                        isLoading={isLoading}
                    >
                        {step === 4 ? 'Create Book' : 'Continue'}
                        {step < 4 && <ChevronRight className="w-4 h-4 ml-2" />}
                    </Button>
                </div>
            </main>
        </div>
    );
}

// Step 1: Basic Info
function Step1({
    data,
    updateData
}: {
    data: BookWizardData;
    updateData: <K extends keyof BookWizardData>(key: K, value: BookWizardData[K]) => void;
}) {
    const genres = data.is_fiction ? GENRES.fiction : GENRES.nonfiction;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold mb-2">What&apos;s your book about?</h2>
                <p className="text-muted-foreground">Let&apos;s start with the basics.</p>
            </div>

            <Input
                label="Working Title"
                placeholder="Enter your book's title"
                value={data.title}
                onChange={(e) => updateData('title', e.target.value)}
                className="text-lg h-14"
            />

            <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                    Type
                </label>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            updateData('is_fiction', true);
                            updateData('genre', '');
                        }}
                        className={cn(
                            'flex-1 h-14 border transition-all',
                            data.is_fiction
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:border-muted-foreground'
                        )}
                    >
                        Fiction
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            updateData('is_fiction', false);
                            updateData('genre', '');
                        }}
                        className={cn(
                            'flex-1 h-14 border transition-all',
                            !data.is_fiction
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border text-muted-foreground hover:border-muted-foreground'
                        )}
                    >
                        Nonfiction
                    </button>
                </div>
            </div>

            <Select
                label="Genre"
                placeholder="Select a genre"
                options={genres.map((g) => ({ value: g, label: g }))}
                value={data.genre}
                onChange={(value) => updateData('genre', value)}
            />
        </div>
    );
}

// Step 2: Writing Details
function Step2({
    data,
    updateData
}: {
    data: BookWizardData;
    updateData: <K extends keyof BookWizardData>(key: K, value: BookWizardData[K]) => void;
}) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold mb-2">Writing details</h2>
                <p className="text-muted-foreground">These help the AI maintain consistency. All optional.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Select
                    label="Point of View"
                    placeholder="Select POV"
                    options={POV_OPTIONS.map((o) => ({ value: o.value || '', label: o.label }))}
                    value={data.pov || ''}
                    onChange={(value) => updateData('pov', value as BookWizardData['pov'])}
                />

                <Select
                    label="Tense"
                    placeholder="Select tense"
                    options={TENSE_OPTIONS.map((o) => ({ value: o.value || '', label: o.label }))}
                    value={data.tense || ''}
                    onChange={(value) => updateData('tense', value as BookWizardData['tense'])}
                />
            </div>

            <Input
                label="Target Audience"
                placeholder="e.g., Young adults, Business professionals"
                value={data.audience}
                onChange={(e) => updateData('audience', e.target.value)}
            />

            <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    Target Word Count (Optional)
                </label>
                <div className="flex items-center gap-4">
                    <Input
                        type="number"
                        placeholder="e.g., 80000"
                        value={data.target_word_count || ''}
                        onChange={(e) => updateData('target_word_count', e.target.value ? parseInt(e.target.value) : null)}
                        className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">words</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Typical novel: 70,000-100,000 words. Memoir: 60,000-80,000 words.
                </p>
            </div>
        </div>
    );
}

// Step 3: Story Foundation
function Step3({
    data,
    updateData
}: {
    data: BookWizardData;
    updateData: <K extends keyof BookWizardData>(key: K, value: BookWizardData[K]) => void;
}) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold mb-2">Story foundation</h2>
                <p className="text-muted-foreground">
                    {data.is_fiction
                        ? 'Describe your story\'s premise and writing style.'
                        : 'Describe your book\'s thesis and writing style.'
                    }
                </p>
            </div>

            <Textarea
                label={data.is_fiction ? 'Premise' : 'Thesis'}
                placeholder={data.is_fiction
                    ? 'Describe your story in a paragraph. What happens? Who are the main characters?'
                    : 'What is the central argument or purpose of your book?'
                }
                value={data.premise}
                onChange={(e) => updateData('premise', e.target.value)}
                className="min-h-[150px]"
            />

            <Textarea
                label="Style Notes"
                placeholder="Describe any specific writing style preferences, influences, or tone guidelines..."
                value={data.style_notes}
                onChange={(e) => updateData('style_notes', e.target.value)}
                className="min-h-[120px]"
            />
        </div>
    );
}

// Step 4: Default Presets
function Step4({
    data,
    updateData,
    updateVoiceTrait,
}: {
    data: BookWizardData;
    updateData: <K extends keyof BookWizardData>(key: K, value: BookWizardData[K]) => void;
    updateVoiceTrait: (trait: keyof VoiceTraits, value: number) => void;
}) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold mb-2">Default AI presets</h2>
                <p className="text-muted-foreground">
                    Configure the default tone and voice for AI assistance. You can override these per chapter.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Select
                    label="Default Tone"
                    options={TONES.map((t) => ({ value: t, label: t }))}
                    value={data.default_tone}
                    onChange={(value) => updateData('default_tone', value)}
                />

                <Select
                    label="Default Pacing"
                    options={PACING_OPTIONS.map((o) => ({ value: o.value || '', label: o.label }))}
                    value={data.default_pacing || ''}
                    onChange={(value) => updateData('default_pacing', value as BookWizardData['default_pacing'])}
                />
            </div>

            <Slider
                label="Tone Intensity"
                value={data.tone_intensity}
                onChange={(value) => updateData('tone_intensity', value)}
                min={1}
                max={5}
                step={1}
            />

            <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
                    Voice Traits
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                    {(Object.keys(VOICE_TRAIT_LABELS) as Array<keyof VoiceTraits>).map((trait) => (
                        <Slider
                            key={trait}
                            label={VOICE_TRAIT_LABELS[trait]}
                            value={data.voice_traits[trait] || 1}
                            onChange={(value) => updateVoiceTrait(trait, value)}
                            min={1}
                            max={5}
                            step={1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
