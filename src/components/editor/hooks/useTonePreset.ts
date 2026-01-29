'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PromptPreset } from '@/lib/types';

interface UseTonePresetOptions {
    bookId: string;
}

interface UseTonePresetReturn {
    presets: PromptPreset[];
    selectedPreset: PromptPreset | null;
    selectedPresetId: string | null;
    setSelectedPresetId: (id: string | null) => void;
    intensity: number;
    setIntensity: (value: number) => void;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook to manage tone presets and intensity settings
 * Testable: Mock Supabase client to test preset loading
 */
export function useTonePreset({ bookId }: UseTonePresetOptions): UseTonePresetReturn {
    const [presets, setPresets] = useState<PromptPreset[]>([]);
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const [intensity, setIntensity] = useState(3);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    const fetchPresets = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('prompt_presets')
                .select('*')
                .eq('book_id', bookId)
                .order('created_at', { ascending: true });

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            const presetsData = data || [];
            setPresets(presetsData);

            // Select default preset or first one
            const defaultPreset = presetsData.find(p => p.is_default);
            if (defaultPreset) {
                setSelectedPresetId(defaultPreset.id);
                setIntensity(defaultPreset.tone_intensity || 3);
            } else if (presetsData.length > 0) {
                setSelectedPresetId(presetsData[0].id);
                setIntensity(presetsData[0].tone_intensity || 3);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load presets');
        } finally {
            setIsLoading(false);
        }
    }, [bookId, supabase]);

    useEffect(() => {
        fetchPresets();
    }, [fetchPresets]);

    const selectedPreset = presets.find(p => p.id === selectedPresetId) || null;

    return {
        presets,
        selectedPreset,
        selectedPresetId,
        setSelectedPresetId,
        intensity,
        setIntensity,
        isLoading,
        error,
    };
}
