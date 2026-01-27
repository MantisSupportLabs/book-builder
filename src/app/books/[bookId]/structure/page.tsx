'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
    GripVertical,
    BookOpen,
    FileText,
    PenTool,
    Sparkles,
    MoreHorizontal,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { cn, getDefaultChapterTitle } from '@/lib/utils';
import type { Book, StructureNode, TreeNode } from '@/lib/types';

export default function StructurePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [nodes, setNodes] = useState<StructureNode[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load book and structure
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

        const { data: nodesData } = await supabase
            .from('structure_nodes')
            .select('*')
            .eq('book_id', bookId)
            .order('sort_order', { ascending: true });

        setNodes(nodesData || []);

        // Expand all parts by default
        const partIds = (nodesData || [])
            .filter((n) => n.node_type === 'part')
            .map((n) => n.id);
        setExpandedNodes(new Set(partIds));

        setIsLoading(false);
    }, [bookId, router, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Build tree structure
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
    const selectedNode = nodes.find((n) => n.id === selectedNodeId);

    // Actions
    const toggleExpand = (nodeId: string) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const addChapter = async (partId: string) => {
        const chaptersInPart = nodes.filter(
            (n) => n.node_type === 'chapter' && n.parent_id === partId
        );
        const sortOrder = chaptersInPart.length;

        const { data: newChapter, error } = await supabase
            .from('structure_nodes')
            .insert({
                book_id: bookId,
                parent_id: partId,
                node_type: 'chapter',
                title: getDefaultChapterTitle(sortOrder),
                sort_order: sortOrder,
            })
            .select()
            .single();

        if (!error && newChapter) {
            setNodes((prev) => [...prev, newChapter]);
            setExpandedNodes((prev) => new Set([...prev, partId]));
            setSelectedNodeId(newChapter.id);
        }
    };

    const addSubchapter = async (chapterId: string) => {
        const subchaptersInChapter = nodes.filter(
            (n) => n.node_type === 'subchapter' && n.parent_id === chapterId
        );
        const sortOrder = subchaptersInChapter.length;

        const { data: newSubchapter, error } = await supabase
            .from('structure_nodes')
            .insert({
                book_id: bookId,
                parent_id: chapterId,
                node_type: 'subchapter',
                title: `Section ${sortOrder + 1}`,
                sort_order: sortOrder,
            })
            .select()
            .single();

        if (!error && newSubchapter) {
            setNodes((prev) => [...prev, newSubchapter]);
            setExpandedNodes((prev) => new Set([...prev, chapterId]));
            setSelectedNodeId(newSubchapter.id);
        }
    };

    const deleteNode = async (nodeId: string) => {
        const nodeToDelete = nodes.find((n) => n.id === nodeId);
        if (!nodeToDelete) return;

        // Don't allow deleting parts
        if (nodeToDelete.node_type === 'part') return;

        // Delete the node and all children
        const { error } = await supabase
            .from('structure_nodes')
            .delete()
            .eq('id', nodeId);

        if (!error) {
            // Remove from local state
            const idsToRemove = new Set([nodeId]);

            // Find all descendants
            const findDescendants = (parentId: string) => {
                nodes.forEach((n) => {
                    if (n.parent_id === parentId) {
                        idsToRemove.add(n.id);
                        findDescendants(n.id);
                    }
                });
            };
            findDescendants(nodeId);

            setNodes((prev) => prev.filter((n) => !idsToRemove.has(n.id)));
            if (selectedNodeId && idsToRemove.has(selectedNodeId)) {
                setSelectedNodeId(null);
            }
        }
    };

    const startEditing = (node: StructureNode) => {
        setEditingNodeId(node.id);
        setEditingTitle(node.title);
    };

    const saveTitle = async () => {
        if (!editingNodeId || !editingTitle.trim()) {
            setEditingNodeId(null);
            return;
        }

        const { error } = await supabase
            .from('structure_nodes')
            .update({ title: editingTitle.trim() })
            .eq('id', editingNodeId);

        if (!error) {
            setNodes((prev) =>
                prev.map((n) =>
                    n.id === editingNodeId ? { ...n, title: editingTitle.trim() } : n
                )
            );
        }
        setEditingNodeId(null);
    };

    const moveNode = async (nodeId: string, direction: 'up' | 'down') => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const siblings = nodes
            .filter((n) => n.parent_id === node.parent_id && n.node_type === node.node_type)
            .sort((a, b) => a.sort_order - b.sort_order);

        const currentIndex = siblings.findIndex((s) => s.id === nodeId);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= siblings.length) return;

        const targetNode = siblings[targetIndex];

        // Swap sort orders
        await supabase
            .from('structure_nodes')
            .update({ sort_order: targetNode.sort_order })
            .eq('id', nodeId);

        await supabase
            .from('structure_nodes')
            .update({ sort_order: node.sort_order })
            .eq('id', targetNode.id);

        // Update local state
        setNodes((prev) =>
            prev.map((n) => {
                if (n.id === nodeId) return { ...n, sort_order: targetNode.sort_order };
                if (n.id === targetNode.id) return { ...n, sort_order: node.sort_order };
                return n;
            })
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="font-mono text-muted-foreground animate-pulse">
                    LOADING STRUCTURE...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border shrink-0">
                <div className="px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <span className="font-medium">{book?.title}</span>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1">
                        <Link href={`/books/${bookId}/structure`}>
                            <Button variant="primary" size="sm">Structure</Button>
                        </Link>
                        <Link href={`/books/${bookId}/presets`}>
                            <Button variant="ghost" size="sm">Presets</Button>
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
            <div className="flex-1 flex min-h-0">
                {/* Left sidebar - Tree */}
                <aside className="w-80 border-r border-border flex flex-col">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            Book Structure
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {tree.map((part) => (
                            <TreeItem
                                key={part.id}
                                node={part}
                                level={0}
                                expanded={expandedNodes.has(part.id)}
                                selected={selectedNodeId === part.id}
                                editing={editingNodeId === part.id}
                                editingTitle={editingTitle}
                                onToggle={() => toggleExpand(part.id)}
                                onSelect={() => setSelectedNodeId(part.id)}
                                onEdit={() => startEditing(nodes.find((n) => n.id === part.id)!)}
                                onEditChange={setEditingTitle}
                                onEditSave={saveTitle}
                                onAddChild={() => addChapter(part.id)}
                            >
                                {part.children.map((chapter) => (
                                    <TreeItem
                                        key={chapter.id}
                                        node={chapter}
                                        level={1}
                                        expanded={expandedNodes.has(chapter.id)}
                                        selected={selectedNodeId === chapter.id}
                                        editing={editingNodeId === chapter.id}
                                        editingTitle={editingTitle}
                                        onToggle={() => toggleExpand(chapter.id)}
                                        onSelect={() => setSelectedNodeId(chapter.id)}
                                        onEdit={() => startEditing(nodes.find((n) => n.id === chapter.id)!)}
                                        onEditChange={setEditingTitle}
                                        onEditSave={saveTitle}
                                        onAddChild={() => addSubchapter(chapter.id)}
                                        onDelete={() => deleteNode(chapter.id)}
                                        onMoveUp={() => moveNode(chapter.id, 'up')}
                                        onMoveDown={() => moveNode(chapter.id, 'down')}
                                    >
                                        {chapter.children.map((sub) => (
                                            <TreeItem
                                                key={sub.id}
                                                node={sub}
                                                level={2}
                                                selected={selectedNodeId === sub.id}
                                                editing={editingNodeId === sub.id}
                                                editingTitle={editingTitle}
                                                onSelect={() => setSelectedNodeId(sub.id)}
                                                onEdit={() => startEditing(nodes.find((n) => n.id === sub.id)!)}
                                                onEditChange={setEditingTitle}
                                                onEditSave={saveTitle}
                                                onDelete={() => deleteNode(sub.id)}
                                                onMoveUp={() => moveNode(sub.id, 'up')}
                                                onMoveDown={() => moveNode(sub.id, 'down')}
                                            />
                                        ))}
                                    </TreeItem>
                                ))}
                            </TreeItem>
                        ))}
                    </div>
                </aside>

                {/* Right panel - Selected node details */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {selectedNode ? (
                        <NodeDetails
                            node={selectedNode}
                            bookId={bookId}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Select a part, chapter, or subchapter to view details</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// Tree Item Component
function TreeItem({
    node,
    level,
    expanded,
    selected,
    editing,
    editingTitle,
    onToggle,
    onSelect,
    onEdit,
    onEditChange,
    onEditSave,
    onAddChild,
    onDelete,
    onMoveUp,
    onMoveDown,
    children,
}: {
    node: TreeNode;
    level: number;
    expanded?: boolean;
    selected: boolean;
    editing: boolean;
    editingTitle: string;
    onToggle?: () => void;
    onSelect: () => void;
    onEdit: () => void;
    onEditChange: (title: string) => void;
    onEditSave: () => void;
    onAddChild?: () => void;
    onDelete?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    children?: React.ReactNode;
}) {
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = onToggle && (hasChildren || node.type !== 'subchapter');

    const paddingLeft = level * 16 + 8;

    return (
        <div>
            <div
                className={cn(
                    'group flex items-center gap-1 py-1.5 pr-2 cursor-pointer transition-all',
                    'hover:bg-secondary',
                    selected && 'bg-secondary border-l-2 border-primary',
                    !selected && 'border-l-2 border-transparent'
                )}
                style={{ paddingLeft }}
            >
                {/* Expand/collapse */}
                {canExpand ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle?.();
                        }}
                        className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight
                            className={cn(
                                'w-4 h-4 transition-transform',
                                expanded && 'rotate-90'
                            )}
                        />
                    </button>
                ) : (
                    <div className="w-5" />
                )}

                {/* Node content */}
                <div
                    className="flex-1 flex items-center gap-2 min-w-0"
                    onClick={onSelect}
                    onDoubleClick={onEdit}
                >
                    {/* Icon */}
                    {node.type === 'part' && (
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    )}
                    {node.type === 'chapter' && (
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    {node.type === 'subchapter' && (
                        <span className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0">
                            ┗
                        </span>
                    )}

                    {/* Title */}
                    {editing ? (
                        <Input
                            value={editingTitle}
                            onChange={(e) => onEditChange(e.target.value)}
                            onBlur={onEditSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onEditSave();
                                if (e.key === 'Escape') onEditSave();
                            }}
                            className="h-6 text-sm py-0"
                            autoFocus
                        />
                    ) : (
                        <span
                            className={cn(
                                'truncate text-sm',
                                node.type === 'part' && 'font-semibold uppercase text-xs tracking-wider',
                                selected && 'text-primary'
                            )}
                        >
                            {node.title}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onMoveUp && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveUp();
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowUp className="w-3 h-3" />
                        </button>
                    )}
                    {onMoveDown && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveDown();
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowDown className="w-3 h-3" />
                        </button>
                    )}
                    {onAddChild && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddChild();
                            }}
                            className="p-1 text-muted-foreground hover:text-primary"
                            title={node.type === 'part' ? 'Add chapter' : 'Add subchapter'}
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Children */}
            {expanded && children}
        </div>
    );
}

// Node Details Component
function NodeDetails({ node, bookId }: { node: StructureNode; bookId: string }) {
    return (
        <div className="max-w-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {node.node_type}
                    </span>
                    <h1 className="text-2xl font-semibold mt-1">{node.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/books/${bookId}/outline/${node.id}`}>
                        <Button variant="secondary" size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Outline
                        </Button>
                    </Link>
                    {node.node_type !== 'part' && (
                        <Link href={`/books/${bookId}/write/${node.id}`}>
                            <Button size="sm">
                                <PenTool className="w-4 h-4 mr-2" />
                                Write
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <div className="bg-card border border-border p-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                        Outline Status
                    </div>
                    <div className="text-lg font-mono text-warning">PENDING</div>
                </div>
                <div className="bg-card border border-border p-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                        Draft Status
                    </div>
                    <div className="text-lg font-mono text-muted-foreground">NOT STARTED</div>
                </div>
                <div className="bg-card border border-border p-4">
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                        Word Count
                    </div>
                    <div className="text-lg font-mono">0</div>
                </div>
            </div>

            {/* AI suggestions */}
            <div className="bg-card border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="font-mono text-xs uppercase tracking-wider text-accent">
                        AI Actions
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {node.node_type === 'part' && (
                        <Button variant="secondary" size="sm">
                            Suggest Chapters
                        </Button>
                    )}
                    <Button variant="secondary" size="sm">
                        Generate Outline
                    </Button>
                    {node.node_type === 'chapter' && (
                        <Button variant="secondary" size="sm">
                            Suggest Subchapters
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
