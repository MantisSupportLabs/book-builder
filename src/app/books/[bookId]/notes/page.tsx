'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import {
    ChevronLeft,
    BookOpen,
    Plus,
    Trash2,
    Search,
    FileText,
    Users,
    MapPin,
    Clock,
    Save,
    Check,
    Loader2,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Note } from '@/lib/types';

type NoteType = 'general' | 'character' | 'location' | 'timeline';

export default function NotesPage() {
    const params = useParams();
    const supabase = createClient();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<{ title: string } | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [activeTab, setActiveTab] = useState<NoteType>('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);

        const { data: bookData } = await supabase
            .from('books')
            .select('title')
            .eq('id', bookId)
            .single();

        setBook(bookData);

        const { data: notesData } = await supabase
            .from('notes')
            .select('*')
            .eq('book_id', bookId)
            .is('node_id', null) // Only book-level notes
            .order('updated_at', { ascending: false });

        setNotes(notesData || []);
        setIsLoading(false);
    }, [bookId, supabase]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredNotes = notes.filter(note => {
        const matchesTab = note.note_type === activeTab;
        const matchesSearch = searchQuery === '' ||
            note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const createNote = async () => {
        const { data, error } = await supabase
            .from('notes')
            .insert({
                book_id: bookId,
                title: 'Untitled Note',
                content: '',
                note_type: activeTab,
            })
            .select()
            .single();

        if (!error && data) {
            setNotes(prev => [data, ...prev]);
            setSelectedNote(data);
        }
    };

    const updateNote = async (updates: Partial<Note>) => {
        if (!selectedNote) return;

        setIsSaving(true);
        const { error } = await supabase
            .from('notes')
            .update(updates)
            .eq('id', selectedNote.id);

        if (!error) {
            setNotes(prev => prev.map(n =>
                n.id === selectedNote.id ? { ...n, ...updates } : n
            ));
            setSelectedNote(prev => prev ? { ...prev, ...updates } : null);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
        setIsSaving(false);
    };

    const deleteNote = async (noteId: string) => {
        await supabase.from('notes').delete().eq('id', noteId);
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) {
            setSelectedNote(null);
        }
    };

    const noteTypeIcon = {
        general: FileText,
        character: Users,
        location: MapPin,
        timeline: Clock,
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="font-mono text-muted-foreground animate-pulse">
                    LOADING NOTES...
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
                            <Button variant="primary" size="sm">Notes</Button>
                        </Link>
                        <Link href={`/books/${bookId}/export`}>
                            <Button variant="ghost" size="sm">Export</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <div className="flex min-h-[calc(100vh-3.5rem)]">
                {/* Left sidebar */}
                <aside className="w-80 border-r border-border flex flex-col">
                    {/* Tabs */}
                    <div className="border-b border-border">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NoteType)}>
                            <TabsList className="w-full justify-start p-2 bg-transparent">
                                <TabsTrigger value="general" className="text-xs">
                                    <FileText className="w-3 h-3 mr-1" />
                                    General
                                </TabsTrigger>
                                <TabsTrigger value="character" className="text-xs">
                                    <Users className="w-3 h-3 mr-1" />
                                    Characters
                                </TabsTrigger>
                                <TabsTrigger value="location" className="text-xs">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    Locations
                                </TabsTrigger>
                                <TabsTrigger value="timeline" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Timeline
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Search and create */}
                    <div className="p-3 border-b border-border space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-secondary border border-border focus:border-primary focus:outline-none"
                            />
                        </div>
                        <Button variant="secondary" size="sm" className="w-full" onClick={createNote}>
                            <Plus className="w-4 h-4 mr-2" />
                            New {activeTab === 'character' ? 'Character' : activeTab === 'location' ? 'Location' : activeTab === 'timeline' ? 'Event' : 'Note'}
                        </Button>
                    </div>

                    {/* Notes list */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredNotes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No {activeTab} notes yet
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredNotes.map(note => {
                                    const Icon = noteTypeIcon[note.note_type as NoteType] || FileText;
                                    return (
                                        <button
                                            key={note.id}
                                            onClick={() => setSelectedNote(note)}
                                            className={cn(
                                                'w-full text-left p-3 border transition-all group',
                                                selectedNote?.id === note.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-transparent hover:bg-secondary'
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="font-medium truncate">{note.title || 'Untitled'}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNote(note.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            {note.content && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 pl-6">
                                                    {note.content}
                                                </p>
                                            )}
                                            <div className="text-xs text-muted-foreground mt-2 pl-6">
                                                {formatRelativeTime(note.updated_at)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right panel - Note editor */}
                <main className="flex-1 flex flex-col">
                    {selectedNote ? (
                        <>
                            {/* Note header */}
                            <div className="border-b border-border p-4 flex items-center justify-between">
                                <input
                                    type="text"
                                    value={selectedNote.title || ''}
                                    onChange={(e) => updateNote({ title: e.target.value })}
                                    className="text-xl font-semibold bg-transparent border-none outline-none focus:outline-none w-full"
                                    placeholder="Note title..."
                                />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
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
                            </div>

                            {/* Note content */}
                            <div className="flex-1 p-4">
                                <textarea
                                    value={selectedNote.content || ''}
                                    onChange={(e) => updateNote({ content: e.target.value })}
                                    className="w-full h-full bg-transparent border-none outline-none resize-none font-serif text-lg leading-relaxed"
                                    placeholder="Start writing..."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="mb-4">Select a note to edit or create a new one</p>
                                <Button onClick={createNote}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Note
                                </Button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
