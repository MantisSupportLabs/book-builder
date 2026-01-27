'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import { createClient } from '@/lib/supabase/client';
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    FileText,
    PenTool,
    Save,
    Sparkles,
    History,
    StickyNote,
    Settings,
    Check,
    Loader2,
} from 'lucide-react';
import { cn, debounce, formatWordCount, countWords } from '@/lib/utils';
import type { Book, StructureNode, Draft, Outline, DraftVersion, TreeNode } from '@/lib/types';

export default function WritePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const bookId = params.bookId as string;
    const nodeId = params.nodeId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [nodes, setNodes] = useState<StructureNode[]>([]);
    const [currentNode, setCurrentNode] = useState<StructureNode | null>(null);
    const [outline, setOutline] = useState<Outline | null>(null);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [versions, setVersions] = useState<DraftVersion[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [rightTab, setRightTab] = useState('outline');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalWordCount, setTotalWordCount] = useState(0);

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
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px]',
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

        // Load all structure nodes
        const { data: nodesData } = await supabase
            .from('structure_nodes')
            .select('*')
            .eq('book_id', bookId)
            .order('sort_order', { ascending: true });

        setNodes(nodesData || []);

        // Expand ancestors of current node
        const currentNodeData = nodesData?.find((n) => n.id === nodeId);
        if (currentNodeData) {
            setCurrentNode(currentNodeData);
            const expandSet = new Set<string>();

            // Find and expand all ancestors
            let parentId = currentNodeData.parent_id;
            while (parentId) {
                expandSet.add(parentId);
                const parent = nodesData?.find((n) => n.id === parentId);
                parentId = parent?.parent_id || null;
            }

            // Also expand parts
            nodesData?.filter((n) => n.node_type === 'part').forEach((p) => expandSet.add(p.id));
            setExpandedNodes(expandSet);
        }

        // Load outline for current node
        const { data: outlineData } = await supabase
            .from('outlines')
            .select('*')
            .eq('node_id', nodeId)
            .single();

        setOutline(outlineData);

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

        // Load versions
        if (draftData) {
            const { data: versionsData } = await supabase
                .from('draft_versions')
                .select('*')
                .eq('draft_id', draftData.id)
                .order('created_at', { ascending: false })
                .limit(20);

            setVersions(versionsData || []);
        }

        // Calculate total word count
        const { data: draftsData } = await supabase
            .from('drafts')
            .select('word_count')
            .in('node_id', nodesData?.map((n) => n.id) || []);

        const total = draftsData?.reduce((sum, d) => sum + (d.word_count || 0), 0) || 0;
        setTotalWordCount(total);

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

            setDraft((prev) => prev ? { ...prev, content, word_count: wordCount } : prev);
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

    // Debounced save (2 seconds)
    const debouncedSave = useMemo(
        () => debounce((content: string) => saveDraft(content), 2000),
        [saveDraft]
    );

    // Manual checkpoint save
    const saveCheckpoint = async () => {
        if (!draft || !editor) return;

        setIsSaving(true);

        // Save current content first
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

        // Reload versions
        const { data: versionsData } = await supabase
            .from('draft_versions')
            .select('*')
            .eq('draft_id', draft.id)
            .order('created_at', { ascending: false })
            .limit(20);

        setVersions(versionsData || []);
        setIsSaving(false);
    };

    // Build tree for navigation
    const buildTree = (nodes: StructureNode[]): TreeNode[] => {
        const parts = nodes.filter((n) => n.node_type === 'part');

        return parts.map((part) => {
            const chapters = nodes
                .filter((n) => n.node_type === 'chapter' && n.parent_id === part.id)
                .sort((a, b) => a.sort_order - b.sort_order);

            return {
                id: part.id,
                title: part.title,
                type: 'part',
                children: chapters.map((chapter) => {
                    const subchapters = nodes
                        .filter((n) => n.node_type === 'subchapter' && n.parent_id === chapter.id)
                        .sort((a, b) => a.sort_order - b.sort_order);

                    return {
                        id: chapter.id,
                        title: chapter.title,
                        type: 'chapter',
                        children: subchapters.map((sub) => ({
                            id: sub.id,
                            title: sub.title,
                            type: 'subchapter',
                            children: [],
                        })),
                    };
                }),
            };
        }) as TreeNode[];
    };

    const tree = buildTree(nodes);
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

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
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

            {/* Main content */}
            <div className="flex-1 flex min-h-0">
                {/* Left sidebar - Navigation tree */}
                <aside className="w-64 border-r border-border flex flex-col shrink-0">
                    <div className="p-3 border-b border-border">
                        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            Navigation
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {tree.map((part) => (
                            <NavTreeItem
                                key={part.id}
                                node={part}
                                level={0}
                                expanded={expandedNodes.has(part.id)}
                                currentNodeId={nodeId}
                                bookId={bookId}
                                onToggle={() => {
                                    setExpandedNodes((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(part.id)) next.delete(part.id);
                                        else next.add(part.id);
                                        return next;
                                    });
                                }}
                            >
                                {part.children.map((chapter) => (
                                    <NavTreeItem
                                        key={chapter.id}
                                        node={chapter}
                                        level={1}
                                        expanded={expandedNodes.has(chapter.id)}
                                        currentNodeId={nodeId}
                                        bookId={bookId}
                                        onToggle={() => {
                                            setExpandedNodes((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(chapter.id)) next.delete(chapter.id);
                                                else next.add(chapter.id);
                                                return next;
                                            });
                                        }}
                                    >
                                        {chapter.children.map((sub) => (
                                            <NavTreeItem
                                                key={sub.id}
                                                node={sub}
                                                level={2}
                                                currentNodeId={nodeId}
                                                bookId={bookId}
                                            />
                                        ))}
                                    </NavTreeItem>
                                ))}
                            </NavTreeItem>
                        ))}
                    </div>
                </aside>

                {/* Center - Editor */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto p-8">
                        <div className="editor-canvas">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </main>

                {/* Right sidebar - Tabs */}
                <aside className="w-80 border-l border-border flex flex-col shrink-0">
                    <Tabs value={rightTab} onValueChange={setRightTab} className="flex-1 flex flex-col">
                        <TabsList className="shrink-0 px-2">
                            <TabsTrigger value="outline">
                                <FileText className="w-3 h-3 mr-1.5" />
                                Outline
                            </TabsTrigger>
                            <TabsTrigger value="notes">
                                <StickyNote className="w-3 h-3 mr-1.5" />
                                Notes
                            </TabsTrigger>
                            <TabsTrigger value="versions">
                                <History className="w-3 h-3 mr-1.5" />
                                Versions
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto">
                            <TabsContent value="outline" className="p-4">
                                <OutlinePanel outline={outline} nodeId={nodeId} bookId={bookId} />
                            </TabsContent>

                            <TabsContent value="notes" className="p-4">
                                <NotesPanel bookId={bookId} nodeId={nodeId} />
                            </TabsContent>

                            <TabsContent value="versions" className="p-4">
                                <VersionsPanel
                                    versions={versions}
                                    onRestore={(content) => {
                                        editor?.commands.setContent(content);
                                        saveDraft(content);
                                    }}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* AI Actions */}
                    <div className="border-t border-border p-4 shrink-0">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <span className="text-xs font-mono uppercase tracking-wider text-accent">
                                AI Actions
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="secondary" size="sm" className="text-xs">
                                Expand
                            </Button>
                            <Button variant="secondary" size="sm" className="text-xs">
                                Shorten
                            </Button>
                            <Button variant="secondary" size="sm" className="text-xs">
                                Rewrite
                            </Button>
                            <Button variant="secondary" size="sm" className="text-xs">
                                Continue
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

// Navigation Tree Item
function NavTreeItem({
    node,
    level,
    expanded,
    currentNodeId,
    bookId,
    onToggle,
    children,
}: {
    node: TreeNode;
    level: number;
    expanded?: boolean;
    currentNodeId: string;
    bookId: string;
    onToggle?: () => void;
    children?: React.ReactNode;
}) {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.id === currentNodeId;
    const isWritable = node.type !== 'part';

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-1 py-1 pr-2 text-sm transition-colors',
                    isSelected && 'bg-secondary border-l-2 border-primary',
                    !isSelected && 'border-l-2 border-transparent hover:bg-secondary/50'
                )}
                style={{ paddingLeft: level * 12 + 8 }}
            >
                {hasChildren ? (
                    <button
                        onClick={onToggle}
                        className="w-4 h-4 flex items-center justify-center text-muted-foreground"
                    >
                        <ChevronRight
                            className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')}
                        />
                    </button>
                ) : (
                    <div className="w-4" />
                )}

                {isWritable ? (
                    <Link
                        href={`/books/${bookId}/write/${node.id}`}
                        className={cn(
                            'flex-1 truncate',
                            isSelected && 'text-primary',
                            !isSelected && 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {node.title}
                    </Link>
                ) : (
                    <span className="flex-1 truncate text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {node.title}
                    </span>
                )}
            </div>
            {expanded && children}
        </div>
    );
}

// Outline Panel
function OutlinePanel({
    outline,
    nodeId,
    bookId
}: {
    outline: Outline | null;
    nodeId: string;
    bookId: string;
}) {
    if (!outline) {
        return (
            <div className="text-center py-8">
                <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">No outline yet</p>
                <Link href={`/books/${bookId}/outline/${nodeId}`}>
                    <Button variant="secondary" size="sm">
                        Create Outline
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {outline.summary && (
                <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Summary
                    </label>
                    <p className="text-sm mt-1">{outline.summary}</p>
                </div>
            )}
            {outline.purpose && (
                <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Purpose
                    </label>
                    <p className="text-sm mt-1">{outline.purpose}</p>
                </div>
            )}
            {outline.conflict_or_argument && (
                <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Conflict / Argument
                    </label>
                    <p className="text-sm mt-1">{outline.conflict_or_argument}</p>
                </div>
            )}
            {outline.turning_point && (
                <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Turning Point
                    </label>
                    <p className="text-sm mt-1">{outline.turning_point}</p>
                </div>
            )}
            <Link href={`/books/${bookId}/outline/${nodeId}`}>
                <Button variant="ghost" size="sm" className="w-full mt-4">
                    Edit Outline
                </Button>
            </Link>
        </div>
    );
}

// Notes Panel
function NotesPanel({ bookId, nodeId }: { bookId: string; nodeId: string }) {
    return (
        <div className="text-center py-8">
            <StickyNote className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">No notes for this section</p>
            <Link href={`/books/${bookId}/notes`}>
                <Button variant="secondary" size="sm">
                    Manage Notes
                </Button>
            </Link>
        </div>
    );
}

// Versions Panel
function VersionsPanel({
    versions,
    onRestore,
}: {
    versions: DraftVersion[];
    onRestore: (content: string) => void;
}) {
    if (versions.length === 0) {
        return (
            <div className="text-center py-8">
                <History className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No versions yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                    Click &quot;Checkpoint&quot; to save a version
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {versions.map((version) => (
                <div
                    key={version.id}
                    className="p-3 bg-secondary border border-border hover:border-primary transition-colors"
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                            {version.version_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {formatWordCount(version.word_count)} words
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                        {new Date(version.created_at).toLocaleString()}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => version.content && onRestore(version.content)}
                        className="w-full"
                    >
                        Restore
                    </Button>
                </div>
            ))}
        </div>
    );
}
