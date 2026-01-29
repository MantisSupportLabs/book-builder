'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Note } from '@/lib/types';

interface UseArtifactsOptions {
    bookId: string;
}

interface UseArtifactsReturn {
    characters: Note[];
    locations: Note[];
    settings: Note[];
    timeline: Note[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage book artifacts (notes by category)
 * Testable: Mock the Supabase client to test data fetching logic
 */
export function useArtifacts({ bookId }: UseArtifactsOptions): UseArtifactsReturn {
    const [characters, setCharacters] = useState<Note[]>([]);
    const [locations, setLocations] = useState<Note[]>([]);
    const [settings, setSettings] = useState<Note[]>([]);
    const [timeline, setTimeline] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const fetchArtifacts = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('notes')
                .select('*')
                .eq('book_id', bookId)
                .order('updated_at', { ascending: false });

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            const notes = data || [];

            // Categorize notes by type
            setCharacters(notes.filter(n => n.note_type === 'character'));
            setLocations(notes.filter(n => n.note_type === 'location'));
            setSettings(notes.filter(n => n.note_type === 'general'));
            setTimeline(notes.filter(n => n.note_type === 'timeline'));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load artifacts');
        } finally {
            setIsLoading(false);
        }
    }, [bookId, supabase]);

    useEffect(() => {
        fetchArtifacts();
    }, [fetchArtifacts]);

    return {
        characters,
        locations,
        settings,
        timeline,
        isLoading,
        error,
        refresh: fetchArtifacts,
    };
}
