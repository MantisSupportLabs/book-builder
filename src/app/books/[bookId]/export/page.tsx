'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Select } from '@/components/ui';
import {
    ChevronLeft,
    BookOpen,
    Download,
    FileText,
    FileCode,
    Check,
    Loader2,
    Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Book, StructureNode, Draft, Outline } from '@/lib/types';

type ExportFormat = 'markdown' | 'html' | 'txt';
type ContentOption = 'all' | 'drafted_only' | 'outlined_only';

interface TreeNode extends StructureNode {
    children: TreeNode[];
    outline?: Outline | null;
    draft?: Draft | null;
}

export default function ExportPage() {
    const params = useParams();
    const supabase = createClient();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [format, setFormat] = useState<ExportFormat>('markdown');
    const [contentOption, setContentOption] = useState<ContentOption>('all');
    const [includeOutlines, setIncludeOutlines] = useState(false);
    const [includeToc, setIncludeToc] = useState(true);
    const [preview, setPreview] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);

        // Load book
        const { data: bookData } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        setBook(bookData);

        // Load structure
        const { data: nodes } = await supabase
            .from('structure_nodes')
            .select('*')
            .eq('book_id', bookId)
            .order('sort_order', { ascending: true });

        // Load outlines and drafts
        const nodeIds = nodes?.map(n => n.id) || [];

        const { data: outlines } = await supabase
            .from('outlines')
            .select('*')
            .in('node_id', nodeIds.length > 0 ? nodeIds : ['none']);

        const { data: drafts } = await supabase
            .from('drafts')
            .select('*')
            .in('node_id', nodeIds.length > 0 ? nodeIds : ['none']);

        // Build tree
        const buildTree = (parentId: string | null): TreeNode[] => {
            return (nodes || [])
                .filter(n => n.parent_id === parentId)
                .map(node => ({
                    ...node,
                    children: buildTree(node.id),
                    outline: outlines?.find(o => o.node_id === node.id) || null,
                    draft: drafts?.find(d => d.node_id === node.id) || null,
                }));
        };

        setTree(buildTree(null));
        setIsLoading(false);
    }, [bookId, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Generate preview when options change
    useEffect(() => {
        if (book && tree.length > 0) {
            const content = generateExport(book, tree, format, contentOption, includeOutlines, includeToc);
            setPreview(content);
        }
    }, [book, tree, format, contentOption, includeOutlines, includeToc]);

    const generateExport = (
        book: Book,
        tree: TreeNode[],
        format: ExportFormat,
        contentOption: ContentOption,
        includeOutlines: boolean,
        includeToc: boolean
    ): string => {
        let output = '';

        // Title
        if (format === 'markdown') {
            output += `# ${book.title}\n\n`;
        } else if (format === 'html') {
            output += `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>${book.title}</title>\n<style>\nbody { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.8; }\nh1, h2, h3 { font-family: system-ui, sans-serif; }\nblockquote { border-left: 3px solid #ccc; padding-left: 1rem; margin-left: 0; color: #666; }\n</style>\n</head>\n<body>\n<h1>${book.title}</h1>\n`;
        } else {
            output += `${book.title.toUpperCase()}\n${'='.repeat(book.title.length)}\n\n`;
        }

        // Book metadata
        if (book.premise) {
            if (format === 'markdown') {
                output += `> ${book.premise}\n\n`;
            } else if (format === 'html') {
                output += `<blockquote>${book.premise}</blockquote>\n`;
            } else {
                output += `${book.premise}\n\n`;
            }
        }

        // Table of contents
        if (includeToc && format === 'markdown') {
            output += `## Table of Contents\n\n`;
            const addToToc = (nodes: TreeNode[], depth: number = 0) => {
                for (const node of nodes) {
                    const indent = '  '.repeat(depth);
                    output += `${indent}- ${node.title}\n`;
                    if (node.children.length > 0) {
                        addToToc(node.children, depth + 1);
                    }
                }
            };
            addToToc(tree);
            output += '\n---\n\n';
        }

        // Content
        const addContent = (nodes: TreeNode[], depth: number = 2) => {
            for (const node of nodes) {
                const hasDraft = node.draft && node.draft.content && node.draft.word_count > 0;
                const hasOutline = node.outline && node.outline.summary;

                // Filter based on content option
                if (contentOption === 'drafted_only' && !hasDraft) {
                    if (node.children.length > 0) addContent(node.children, depth + 1);
                    continue;
                }
                if (contentOption === 'outlined_only' && !hasOutline) {
                    if (node.children.length > 0) addContent(node.children, depth + 1);
                    continue;
                }

                // Node heading
                const headingLevel = Math.min(depth, 6);
                if (format === 'markdown') {
                    output += `${'#'.repeat(headingLevel)} ${node.title}\n\n`;
                } else if (format === 'html') {
                    output += `<h${headingLevel}>${node.title}</h${headingLevel}>\n`;
                } else {
                    output += `${node.title}\n${'-'.repeat(node.title.length)}\n\n`;
                }

                // Outline (if enabled)
                if (includeOutlines && hasOutline) {
                    if (format === 'markdown') {
                        output += `> **Summary:** ${node.outline!.summary}\n\n`;
                    } else if (format === 'html') {
                        output += `<blockquote><strong>Summary:</strong> ${node.outline!.summary}</blockquote>\n`;
                    } else {
                        output += `[Summary: ${node.outline!.summary}]\n\n`;
                    }
                }

                // Draft content
                if (hasDraft) {
                    // Strip HTML tags for non-HTML formats
                    let content = node.draft!.content || '';
                    if (format !== 'html') {
                        content = content
                            .replace(/<p>/g, '')
                            .replace(/<\/p>/g, '\n\n')
                            .replace(/<br\s*\/?>/g, '\n')
                            .replace(/<[^>]+>/g, '')
                            .trim();
                    }

                    if (format === 'html') {
                        output += `<div class="content">${content}</div>\n`;
                    } else {
                        output += `${content}\n\n`;
                    }
                }

                // Recurse into children
                if (node.children.length > 0) {
                    addContent(node.children, depth + 1);
                }
            }
        };

        addContent(tree);

        // Close HTML
        if (format === 'html') {
            output += `</body>\n</html>`;
        }

        return output;
    };

    const downloadExport = () => {
        setIsExporting(true);

        const extension = format === 'markdown' ? 'md' : format;
        const mimeType = format === 'html' ? 'text/html' : 'text/plain';
        const blob = new Blob([preview], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${book?.title || 'book'}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsExporting(false);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(preview);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="font-mono text-muted-foreground animate-pulse">
                    LOADING EXPORT...
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
                            <Button variant="ghost" size="sm">Presets</Button>
                        </Link>
                        <Link href={`/books/${bookId}/notes`}>
                            <Button variant="ghost" size="sm">Notes</Button>
                        </Link>
                        <Link href={`/books/${bookId}/export`}>
                            <Button variant="primary" size="sm">Export</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <div className="flex min-h-[calc(100vh-3.5rem)]">
                {/* Left sidebar - Options */}
                <aside className="w-80 border-r border-border p-6">
                    <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-6">
                        Export Options
                    </h2>

                    <div className="space-y-6">
                        {/* Format */}
                        <Select
                            label="Format"
                            options={[
                                { value: 'markdown', label: 'Markdown (.md)' },
                                { value: 'html', label: 'HTML (.html)' },
                                { value: 'txt', label: 'Plain Text (.txt)' },
                            ]}
                            value={format}
                            onChange={(v) => setFormat(v as ExportFormat)}
                        />

                        {/* Content filter */}
                        <Select
                            label="Include Content"
                            options={[
                                { value: 'all', label: 'All chapters' },
                                { value: 'drafted_only', label: 'Drafted only' },
                                { value: 'outlined_only', label: 'Outlined only' },
                            ]}
                            value={contentOption}
                            onChange={(v) => setContentOption(v as ContentOption)}
                        />

                        {/* Checkboxes */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeToc}
                                    onChange={(e) => setIncludeToc(e.target.checked)}
                                    className="w-4 h-4 border border-border bg-secondary accent-primary"
                                />
                                <span className="text-sm">Include table of contents</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeOutlines}
                                    onChange={(e) => setIncludeOutlines(e.target.checked)}
                                    className="w-4 h-4 border border-border bg-secondary accent-primary"
                                />
                                <span className="text-sm">Include outlines as summaries</span>
                            </label>
                        </div>

                        {/* Export buttons */}
                        <div className="pt-4 space-y-3">
                            <Button className="w-full" onClick={downloadExport} isLoading={isExporting}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                            <Button variant="secondary" className="w-full" onClick={copyToClipboard}>
                                {isCopied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy to Clipboard
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="pt-6 border-t border-border">
                            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                                Export Stats
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Characters</span>
                                    <span className="font-mono">{preview.length.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Words</span>
                                    <span className="font-mono">{preview.split(/\s+/).filter(Boolean).length.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right panel - Preview */}
                <main className="flex-1 flex flex-col">
                    <div className="border-b border-border p-4 flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            Preview
                        </span>
                        <div className="flex items-center gap-2">
                            {format === 'markdown' && <FileCode className="w-4 h-4 text-muted-foreground" />}
                            {format === 'html' && <FileCode className="w-4 h-4 text-muted-foreground" />}
                            {format === 'txt' && <FileText className="w-4 h-4 text-muted-foreground" />}
                            <span className="text-sm text-muted-foreground">{format.toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                        <pre className={cn(
                            "text-sm whitespace-pre-wrap font-mono",
                            format === 'html' && "text-xs"
                        )}>
                            {preview || 'No content to export'}
                        </pre>
                    </div>
                </main>
            </div>
        </div>
    );
}
