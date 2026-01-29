'use client';

import { ReactNode, useState } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { EditorToolbar } from './EditorToolbar';
import { ArtifactsPanel } from './artifacts';
import { OutlinePanel, AIActions } from './outline';
import type { Book, Note } from '@/lib/types';

interface EditorLayoutProps {
    bookId: string;
    nodeId: string;
    book: Book | null;
    editor: Editor | null;
    header: ReactNode;
    isProcessingAI?: boolean;
    activeAIAction?: string | null;
    onAIAction?: (action: 'expand' | 'shorten' | 'rewrite' | 'continue') => void;
}

/**
 * Main 3-panel editor layout
 * - Left: Artifacts (characters, locations, etc.)
 * - Center: TipTap editor with toolbar
 * - Right: Outline fields + Tone controls
 * 
 * Testable: Mock editor and hooks
 */
export function EditorLayout({
    bookId,
    nodeId,
    book,
    editor,
    header,
    isProcessingAI = false,
    activeAIAction = null,
    onAIAction,
}: EditorLayoutProps) {
    const [selectedArtifact, setSelectedArtifact] = useState<Note | null>(null);

    const handleArtifactSelect = (artifact: Note) => {
        setSelectedArtifact(artifact);
        // Could show a modal or tooltip with artifact details
        console.log('Selected artifact:', artifact);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            {header}

            {/* Main content - 3 panel layout */}
            <div className="flex-1 flex min-h-0">
                {/* Left sidebar - Artifacts */}
                <aside className="w-64 border-r border-border flex-shrink-0 overflow-hidden bg-card">
                    <ArtifactsPanel
                        bookId={bookId}
                        onSelectArtifact={handleArtifactSelect}
                    />
                </aside>

                {/* Center - Editor */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Formatting Toolbar */}
                    {editor && <EditorToolbar editor={editor} />}

                    {/* Editor content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-3xl mx-auto p-8">
                            <div className="editor-canvas bg-secondary/30 border border-border rounded-sm">
                                {editor && <EditorContent editor={editor} />}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right sidebar - Outline & Tone */}
                <aside className="w-80 border-l border-border flex-shrink-0 flex flex-col overflow-hidden bg-card">
                    <div className="flex-1 overflow-hidden">
                        <OutlinePanel
                            bookId={bookId}
                            nodeId={nodeId}
                            book={book}
                            isFiction={book?.is_fiction ?? true}
                        />
                    </div>

                    {/* AI Actions at bottom */}
                    {onAIAction && (
                        <AIActions
                            onExpand={() => onAIAction('expand')}
                            onShorten={() => onAIAction('shorten')}
                            onRewrite={() => onAIAction('rewrite')}
                            onContinue={() => onAIAction('continue')}
                            isProcessing={isProcessingAI}
                            activeAction={activeAIAction}
                        />
                    )}
                </aside>
            </div>

            {/* Artifact detail modal/tooltip - could be expanded */}
            {selectedArtifact && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setSelectedArtifact(null)}
                >
                    <div
                        className="bg-card border border-border p-6 max-w-md w-full m-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-2">{selectedArtifact.title}</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedArtifact.content || 'No content'}
                        </p>
                        <button
                            onClick={() => setSelectedArtifact(null)}
                            className="mt-4 w-full py-2 bg-secondary text-sm hover:bg-muted transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
