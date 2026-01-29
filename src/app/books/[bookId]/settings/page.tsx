'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea, Select, Slider } from '@/components/ui';
import {
    ChevronLeft,
    BookOpen,
    Save,
    Trash2,
    Check,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import {
    FICTION_GENRES,
    NONFICTION_GENRES,
    POV_OPTIONS,
    TENSE_OPTIONS,
    AUDIENCE_OPTIONS,
} from '@/lib/types';
import type { Book } from '@/lib/types';

export default function BookSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [formData, setFormData] = useState<Partial<Book>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);

        const { data: bookData } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (!bookData) {
            router.push('/');
            return;
        }

        setBook(bookData);
        setFormData(bookData);
        setIsLoading(false);
    }, [bookId, router, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateField = <K extends keyof Book>(key: K, value: Book[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setIsSaved(false);
    };

    const saveSettings = async () => {
        setIsSaving(true);

        const { error } = await supabase
            .from('books')
            .update({
                title: formData.title,
                is_fiction: formData.is_fiction,
                genre: formData.genre,
                pov: formData.pov,
                tense: formData.tense,
                audience: formData.audience,
                target_word_count: formData.target_word_count,
                premise: formData.premise,
                style_notes: formData.style_notes,
            })
            .eq('id', bookId);

        if (!error) {
            setBook(prev => prev ? { ...prev, ...formData } : null);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        }

        setIsSaving(false);
    };

    const deleteBook = async () => {
        setIsDeleting(true);

        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId);

        if (!error) {
            router.push('/');
        }

        setIsDeleting(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="font-mono text-muted-foreground animate-pulse">
                    LOADING SETTINGS...
                </div>
            </div>
        );
    }

    const genres = formData.is_fiction ? FICTION_GENRES : NONFICTION_GENRES;

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

                    <div className="flex items-center gap-4">
                        {/* Save status */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : isSaved ? (
                                <>
                                    <Check className="w-3 h-3 text-success" />
                                    <span>Saved</span>
                                </>
                            ) : null}
                        </div>

                        <Button onClick={saveSettings} isLoading={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Book Settings
                    </span>
                    <h1 className="text-2xl font-semibold mt-1">Edit Book</h1>
                </div>

                <div className="space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
                            Basic Information
                        </h2>
                        <div className="space-y-4">
                            <Input
                                label="Book Title"
                                value={formData.title || ''}
                                onChange={(e) => updateField('title', e.target.value)}
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <Select
                                    label="Book Type"
                                    options={[
                                        { value: 'true', label: 'Fiction' },
                                        { value: 'false', label: 'Nonfiction' },
                                    ]}
                                    value={String(formData.is_fiction)}
                                    onChange={(v) => {
                                        updateField('is_fiction', v === 'true');
                                        updateField('genre', ''); // Reset genre when type changes
                                    }}
                                />

                                <Select
                                    label="Genre"
                                    options={genres.map(g => ({ value: g, label: g }))}
                                    value={formData.genre || ''}
                                    onChange={(v) => updateField('genre', v)}
                                    placeholder="Select genre..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Writing Details */}
                    <section>
                        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
                            Writing Details
                        </h2>
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Select
                                    label="Point of View"
                                    options={POV_OPTIONS.map(o => ({ value: o.value || '', label: o.label }))}
                                    value={formData.pov || ''}
                                    onChange={(v) => updateField('pov', v as Book['pov'])}
                                    placeholder="Select POV..."
                                />

                                <Select
                                    label="Tense"
                                    options={TENSE_OPTIONS.map(o => ({ value: o.value || '', label: o.label }))}
                                    value={formData.tense || ''}
                                    onChange={(v) => updateField('tense', v as Book['tense'])}
                                    placeholder="Select tense..."
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Select
                                    label="Target Audience"
                                    options={AUDIENCE_OPTIONS}
                                    value={formData.audience || ''}
                                    onChange={(v) => updateField('audience', v)}
                                    placeholder="Select audience..."
                                />

                                <Input
                                    label="Target Word Count"
                                    type="number"
                                    value={formData.target_word_count || ''}
                                    onChange={(e) => updateField('target_word_count', parseInt(e.target.value) || 0)}
                                    placeholder="e.g., 80000"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Story Foundation */}
                    <section>
                        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
                            Story Foundation
                        </h2>
                        <div className="space-y-4">
                            <Textarea
                                label={formData.is_fiction ? "Premise / Logline" : "Central Thesis"}
                                value={formData.premise || ''}
                                onChange={(e) => updateField('premise', e.target.value)}
                                placeholder={
                                    formData.is_fiction
                                        ? "A brief summary of your story's core concept..."
                                        : "The main argument or thesis of your book..."
                                }
                                className="min-h-[100px]"
                            />

                            <Textarea
                                label="Style Notes"
                                value={formData.style_notes || ''}
                                onChange={(e) => updateField('style_notes', e.target.value)}
                                placeholder="Notes about your desired writing style, influences, tone preferences..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="pt-8 border-t border-border">
                        <h2 className="font-mono text-xs uppercase tracking-wider text-destructive mb-4">
                            Danger Zone
                        </h2>

                        {!showDeleteConfirm ? (
                            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Book
                            </Button>
                        ) : (
                            <div className="bg-destructive/10 border border-destructive p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-destructive">Delete this book?</h3>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                                            This will permanently delete &quot;{book?.title}&quot; and all its content,
                                            including chapters, outlines, drafts, and notes. This action cannot be undone.
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="destructive"
                                                onClick={deleteBook}
                                                isLoading={isDeleting}
                                            >
                                                Yes, Delete Forever
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setShowDeleteConfirm(false)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
