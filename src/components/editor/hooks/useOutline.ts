'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Outline } from '@/lib/types';

interface UseOutlineOptions {
    nodeId: string;
}

interface UseOutlineReturn {
    outline: Outline | null;
    isLoading: boolean;
    error: string | null;
    updateField: (field: keyof Outline, value: string) => Promise<void>;
    isSaving: boolean;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage outline data for a node
 * Testable: Mock the Supabase client to test CRUD operations
 */
export function useOutline({ nodeId }: UseOutlineOptions): UseOutlineReturn {
    const [outline, setOutline] = useState<Outline | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const fetchOutline = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('outlines')
                .select('*')
                .eq('node_id', nodeId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                // PGRST116 = no rows returned, which is fine
                throw new Error(fetchError.message);
            }

            setOutline(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load outline');
        } finally {
            setIsLoading(false);
        }
    }, [nodeId, supabase]);

    const updateField = useCallback(async (field: keyof Outline, value: string) => {
        setIsSaving(true);

        try {
            if (outline) {
                // Update existing outline
                const { error: updateError } = await supabase
                    .from('outlines')
                    .update({ [field]: value, updated_at: new Date().toISOString() })
                    .eq('id', outline.id);

                if (updateError) throw new Error(updateError.message);

                setOutline(prev => prev ? { ...prev, [field]: value } : prev);
            } else {
                // Create new outline
                const { data, error: insertError } = await supabase
                    .from('outlines')
                    .insert({ node_id: nodeId, [field]: value })
                    .select()
                    .single();

                if (insertError) throw new Error(insertError.message);

                setOutline(data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save outline');
        } finally {
            setIsSaving(false);
        }
    }, [outline, nodeId, supabase]);

    useEffect(() => {
        fetchOutline();
    }, [fetchOutline]);

    return {
        outline,
        isLoading,
        error,
        updateField,
        isSaving,
        refresh: fetchOutline,
    };
}
