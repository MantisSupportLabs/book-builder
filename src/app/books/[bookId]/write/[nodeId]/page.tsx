'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { EditorLayout } from '@/components/editor';
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Save,
    Check,
    Loader2,
} from 'lucide-react';
import { debounce, formatWordCount, countWords } from '@/lib/utils';
import type { Book, StructureNode, Draft } from '@/lib/types';

export default function WritePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const bookId = params.bookId as string;
    const nodeId = params.nodeId as string;

    // Core state
    const [book, setBook] = useState<Book | null>(null);
    const [currentNode, setCurrentNode] = useState<StructureNode | null>(null);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalWordCount, setTotalWordCount] = useState(0);

    // AI action state
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [activeAIAction, setActiveAIAction] = useState<string | null>(null);

    // TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing your chapter...',
            }),
            CharacterCount,
            Highlight.configure({
                multicolor: true,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
                spellcheck: 'true',
            },
        },
        onUpdate: ({ editor }) => {
            debouncedSave(editor.getHTML());
        },
    });

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

        if (nodeData) {
            setCurrentNode(nodeData);
        }

        // Load draft for current node
        const { data: draftData } = await supabase
            .from('drafts')
            .select('*')
            .eq('node_id', nodeId)
            .single();

        if (draftData) {
            setDraft(draftData);
            editor?.commands.setContent(draftData.content || '');
        }

        // Calculate total word count
        const { data: nodesData } = await supabase
            .from('structure_nodes')
            .select('id')
            .eq('book_id', bookId);

        if (nodesData) {
            const { data: draftsData } = await supabase
                .from('drafts')
                .select('word_count')
                .in('node_id', nodesData.map(n => n.id));

            const total = draftsData?.reduce((sum, d) => sum + (d.word_count || 0), 0) || 0;
            setTotalWordCount(total);
        }

        setIsLoading(false);
    }, [bookId, nodeId, router, supabase, editor]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Save draft
    const saveDraft = useCallback(async (content: string) => {
        if (!currentNode) return;

        setIsSaving(true);
        const wordCount = countWords(content.replace(/<[^>]*>/g, ''));

        if (draft) {
            // Update existing draft
            await supabase
                .from('drafts')
                .update({ content, word_count: wordCount })
                .eq('id', draft.id);

            setDraft(prev => prev ? { ...prev, content, word_count: wordCount } : prev);
        } else {
            // Create new draft
            const { data: newDraft } = await supabase
                .from('drafts')
                .insert({
                    node_id: nodeId,
                    content,
                    word_count: wordCount,
                })
                .select()
                .single();

            if (newDraft) {
                setDraft(newDraft);
            }
        }

        // Update book's updated_at
        await supabase
            .from('books')
            .update({ updated_at: new Date().toISOString(), last_edited_node_id: nodeId })
            .eq('id', bookId);

        setLastSaved(new Date());
        setIsSaving(false);
    }, [currentNode, draft, nodeId, bookId, supabase]);

    // Debounced save
    const debouncedSave = useMemo(
        () => debounce((content: string) => saveDraft(content), 2000),
        [saveDraft]
    );

    // Manual checkpoint save
    const saveCheckpoint = async () => {
        if (!draft || !editor) return;

        setIsSaving(true);
        await saveDraft(editor.getHTML());

        // Create version
        await supabase
            .from('draft_versions')
            .insert({
                draft_id: draft.id,
                content: editor.getHTML(),
                word_count: countWords(editor.getText()),
                version_type: 'manual',
            });

        setIsSaving(false);
    };

    // Handle AI actions on selected text
    const handleAIAction = async (action: 'expand' | 'shorten' | 'rewrite' | 'continue') => {
        if (!editor) return;

        setIsProcessingAI(true);
        setActiveAIAction(action);

        try {
            // TODO: Implement actual AI API call
            // For now, simulate with a delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Placeholder: In reality, you'd call your AI API here
            const selectedText = editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to,
                ' '
            );

            console.log(`AI ${action} on:`, selectedText || 'no selection - will continue from end');
        } catch (error) {
            console.error('AI action failed:', error);
        } finally {
            setIsProcessingAI(false);
            setActiveAIAction(null);
        }
    };

    const currentWordCount = editor ? countWords(editor.getText()) : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="font-mono text-muted-foreground animate-pulse">
                    LOADING EDITOR...
                </div>
            </div>
        );
    }

    // Header component passed to EditorLayout
    const header = (
        <header className="border-b border-border shrink-0">
            <div className="px-4 h-12 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/books/${bookId}/structure`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium truncate max-w-[200px]">{book?.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {currentNode?.title}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Save status */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : lastSaved ? (
                            <>
                                <Check className="w-3 h-3 text-success" />
                                <span>Saved</span>
                            </>
                        ) : null}
                    </div>

                    {/* Word counts */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-muted-foreground">
                            {formatWordCount(currentWordCount)} words
                        </span>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="text-muted-foreground">
                            {formatWordCount(totalWordCount)} total
                        </span>
                    </div>

                    <Button variant="secondary" size="sm" onClick={saveCheckpoint}>
                        <Save className="w-4 h-4 mr-2" />
                        Checkpoint
                    </Button>
                </div>
            </div>
        </header>
    );

    return (
        <EditorLayout
            bookId={bookId}
            nodeId={nodeId}
            book={book}
            editor={editor}
            header={header}
            isProcessingAI={isProcessingAI}
            activeAIAction={activeAIAction}
            onAIAction={handleAIAction}
        />
    );
}
