'use client';

import { useState, useCallback } from 'react';
import type { PromptPreset, Outline, Book } from '@/lib/types';

interface UseAIGenerateOptions {
    bookId: string;
    nodeId: string;
}

interface GenerateContext {
    field: string;
    currentValue?: string;
    outline?: Partial<Outline>;
    book?: Partial<Book>;
    preset?: PromptPreset;
    intensity?: number;
}

interface UseAIGenerateReturn {
    generateField: (context: GenerateContext) => Promise<string>;
    isGenerating: boolean;
    generatingField: string | null;
    error: string | null;
    clearError: () => void;
}

/**
 * Hook to handle AI content generation for outline fields
 * Testable: Mock the generate function to test component behavior
 * 
 * NOTE: This is a stub implementation. Replace with actual AI API calls.
 */
export function useAIGenerate({ bookId, nodeId }: UseAIGenerateOptions): UseAIGenerateReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingField, setGeneratingField] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateField = useCallback(async (context: GenerateContext): Promise<string> => {
        setIsGenerating(true);
        setGeneratingField(context.field);
        setError(null);

        try {
            // TODO: Replace with actual AI API call
            // For now, simulate AI generation with placeholder
            await new Promise(resolve => setTimeout(resolve, 1500));

            const fieldPrompts: Record<string, string> = {
                summary: `This chapter begins with the protagonist facing a crucial decision that will shape the story's direction. The scene establishes tension while advancing the plot.`,
                purpose: `This section serves to deepen character development and introduce the central conflict. It establishes the stakes and emotional weight of the journey ahead.`,
                conflict_or_argument: `The protagonist must confront their inner doubts while facing external opposition. This creates a multi-layered conflict that drives the narrative forward.`,
                turning_point: `A pivotal revelation changes everything the protagonist believed, forcing them to reconsider their approach and make a difficult choice.`,
                key_characters: `Primary focus on the protagonist with supporting appearances from the mentor figure and antagonist. Secondary characters provide context and world-building.`,
                setting: `The scene takes place in a significant location that reflects the emotional state of the characters. Environmental details reinforce the mood and themes.`,
                open_questions: `What consequences will follow from this decision? How will relationships shift? What hidden truths remain to be discovered?`,
            };

            const generated = fieldPrompts[context.field] ||
                `AI-generated content for ${context.field}. This is placeholder text that would be replaced with actual AI output based on the book's context, preset, and outline.`;

            return generated;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'AI generation failed';
            setError(errorMessage);
            throw err;
        } finally {
            setIsGenerating(false);
            setGeneratingField(null);
        }
    }, [bookId, nodeId]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        generateField,
        isGenerating,
        generatingField,
        error,
        clearError,
    };
}
