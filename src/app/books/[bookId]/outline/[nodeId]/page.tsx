'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea } from '@/components/ui';
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    FileText,
    PenTool,
    Sparkles,
    Save,
    Check,
    Loader2,
} from 'lucide-react';
import type { Book, StructureNode, Outline } from '@/lib/types';

export default function OutlinePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const bookId = params.bookId as string;
    const nodeId = params.nodeId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [currentNode, setCurrentNode] = useState<StructureNode | null>(null);
    const [outline, setOutline] = useState<Partial<Outline>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load data
    const loadData = useCallback(async () => {
        setIsLoading(true);

        // Load book
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

        // Load current node
        const { data: nodeData } = await supabase
            .from('structure_nodes')
            .select('*')
            .eq('id', nodeId)
            .single();

        setCurrentNode(nodeData);

        // Load outline
        const { data: outlineData } = await supabase
            .from('outlines')
            .select('*')
            .eq('node_id', nodeId)
            .single();

        if (outlineData) {
            setOutline(outlineData);
        }

        setIsLoading(false);
    }, [bookId, nodeId, router, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Update outline field
    const updateField = (field: keyof Outline, value: string) => {
        setOutline((prev) => ({ ...prev, [field]: value }));
        setIsSaved(false);
    };

    // Save outline
    const saveOutline = async () => {
        setIsSaving(true);

        if (outline.id) {
            // Update existing
            const { error } = await supabase
                .from('outlines')
                .update({
                    summary: outline.summary || null,
                    purpose: outline.purpose || null,
                    conflict_or_argument: outline.conflict_or_argument || null,
                    turning_point: outline.turning_point || null,
                    key_characters: outline.key_characters || null,
                    setting: outline.setting || null,
                    open_questions: outline.open_questions || null,
                })
                .eq('id', outline.id);

            if (!error) {
                setIsSaved(true);
            }
        } else {
            // Create new
            const { data, error } = await supabase
                .from('outlines')
                .insert({
                    node_id: nodeId,
                    summary: outline.summary || null,
                    purpose: outline.purpose || null,
                    conflict_or_argument: outline.conflict_or_argument || null,
                    turning_point: outline.turning_point || null,
                    key_characters: outline.key_characters || null,
                    setting: outline.setting || null,
                    open_questions: outline.open_questions || null,
                })
                .select()
                .single();

            if (!error && data) {
                setOutline(data);
                setIsSaved(true);
            }
        }

        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="font-mono text-muted-foreground animate-pulse">
                    LOADING OUTLINE...
                </div>
            </div>
        );
    }

    const isFiction = book?.is_fiction ?? true;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border">
                <div className="px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/books/${bookId}/structure`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{book?.title}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{currentNode?.title}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-primary">Outline</span>
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

                        <Button variant="secondary" size="sm" onClick={saveOutline} isLoading={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                        </Button>

                        {currentNode?.node_type !== 'part' && (
                            <Link href={`/books/${bookId}/write/${nodeId}`}>
                                <Button size="sm">
                                    <PenTool className="w-4 h-4 mr-2" />
                                    Write
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            {currentNode?.node_type} Outline
                        </span>
                        <h1 className="text-2xl font-semibold mt-1">{currentNode?.title}</h1>
                    </div>
                </div>

                {/* AI Actions */}
                <div className="bg-card border border-border p-4 mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span className="text-xs font-mono uppercase tracking-wider text-accent">
                            AI Actions
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm">
                            Generate Outline
                        </Button>
                        <Button variant="secondary" size="sm">
                            Improve Clarity
                        </Button>
                        {currentNode?.node_type === 'part' && (
                            <Button variant="secondary" size="sm">
                                Suggest Chapters
                            </Button>
                        )}
                        {currentNode?.node_type === 'chapter' && (
                            <Button variant="secondary" size="sm">
                                Generate Subchapters
                            </Button>
                        )}
                    </div>
                </div>

                {/* Outline form */}
                <div className="space-y-6">
                    <Textarea
                        label="Summary *"
                        placeholder={
                            isFiction
                                ? "What happens in this section? Summarize the key events and developments."
                                : "What is covered in this section? Summarize the main points and arguments."
                        }
                        value={outline.summary || ''}
                        onChange={(e) => updateField('summary', e.target.value)}
                        className="min-h-[120px]"
                    />

                    <Textarea
                        label="Purpose / Goal"
                        placeholder={
                            isFiction
                                ? "What is the purpose of this section? What should it accomplish for the story?"
                                : "What should the reader learn or understand from this section?"
                        }
                        value={outline.purpose || ''}
                        onChange={(e) => updateField('purpose', e.target.value)}
                        className="min-h-[100px]"
                    />

                    <Textarea
                        label={isFiction ? "Conflict / Tension" : "Central Argument"}
                        placeholder={
                            isFiction
                                ? "What conflict or tension drives this section? What obstacles does the protagonist face?"
                                : "What is the main argument or thesis of this section?"
                        }
                        value={outline.conflict_or_argument || ''}
                        onChange={(e) => updateField('conflict_or_argument', e.target.value)}
                        className="min-h-[100px]"
                    />

                    <Textarea
                        label={isFiction ? "Turning Point" : "Key Takeaway"}
                        placeholder={
                            isFiction
                                ? "Is there a turning point or pivotal moment? How do things change?"
                                : "What is the key takeaway the reader should remember?"
                        }
                        value={outline.turning_point || ''}
                        onChange={(e) => updateField('turning_point', e.target.value)}
                        className="min-h-[100px]"
                    />

                    <Textarea
                        label={isFiction ? "Key Characters" : "Key Topics / Concepts"}
                        placeholder={
                            isFiction
                                ? "Which characters appear? What are their roles and motivations?"
                                : "What key topics, concepts, or examples will you cover?"
                        }
                        value={outline.key_characters || ''}
                        onChange={(e) => updateField('key_characters', e.target.value)}
                        className="min-h-[100px]"
                    />

                    <Textarea
                        label="Setting / Context"
                        placeholder={
                            isFiction
                                ? "Where does this take place? What is the atmosphere and time period?"
                                : "What context or background information is needed?"
                        }
                        value={outline.setting || ''}
                        onChange={(e) => updateField('setting', e.target.value)}
                        className="min-h-[100px]"
                    />

                    <Textarea
                        label="Open Questions / TODOs"
                        placeholder="Any unresolved questions, research needed, or things to figure out later..."
                        value={outline.open_questions || ''}
                        onChange={(e) => updateField('open_questions', e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
                    <Link href={`/books/${bookId}/structure`}>
                        <Button variant="ghost">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to Structure
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={saveOutline} isLoading={isSaving}>
                            Save Outline
                        </Button>
                        {currentNode?.node_type !== 'part' && (
                            <Link href={`/books/${bookId}/write/${nodeId}`}>
                                <Button>
                                    Start Writing
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
