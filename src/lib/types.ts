// Book Builder - Core Types

// ================================
// Database Types
// ================================

export interface Book {
    id: string;
    user_id: string;
    title: string;
    is_fiction: boolean;
    genre: string | null;
    target_word_count: number | null;
    pov: 'first' | 'third-limited' | 'third-omniscient' | null;
    tense: 'past' | 'present' | null;
    audience: string | null;
    style_notes: string | null;
    premise: string | null;
    created_at: string;
    updated_at: string;
    last_edited_node_id: string | null;
}

export interface StructureNode {
    id: string;
    book_id: string;
    parent_id: string | null;
    node_type: 'part' | 'chapter' | 'subchapter';
    title: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface Outline {
    id: string;
    node_id: string;
    summary: string | null;
    purpose: string | null;
    conflict_or_argument: string | null;
    turning_point: string | null;
    key_characters: string | null;
    setting: string | null;
    open_questions: string | null;
    created_at: string;
    updated_at: string;
}

export interface Draft {
    id: string;
    node_id: string;
    content: string | null;
    word_count: number;
    created_at: string;
    updated_at: string;
}

export interface DraftVersion {
    id: string;
    draft_id: string;
    content: string | null;
    word_count: number;
    version_type: 'auto' | 'manual' | 'ai_checkpoint';
    created_at: string;
}

export interface PromptPreset {
    id: string;
    book_id: string;
    name: string;
    tone: string | null;
    tone_intensity: number | null;
    voice_traits: VoiceTraits | null;
    pacing: 'slow' | 'medium' | 'fast' | null;
    intent_tag: string | null;
    do_rules: string | null;
    dont_rules: string | null;
    pov_constraint: string | null;
    tense_constraint: string | null;
    inspiration_traits: string | null;
    is_default: boolean;
    created_at: string;
}

export interface VoiceTraits {
    concise?: number;      // 1-5
    literary?: number;     // 1-5
    formal?: number;       // 1-5
    gritty?: number;       // 1-5
    poetic?: number;       // 1-5
    humorous?: number;     // 1-5
    dramatic?: number;     // 1-5
    minimalist?: number;   // 1-5
}

export interface NodePresetOverride {
    id: string;
    node_id: string;
    preset_id: string | null;
    relative_tone_enabled: boolean;
    relative_tone_delta: number | null;
    overrides: Partial<PromptPreset> | null;
    created_at: string;
}

export interface Note {
    id: string;
    book_id: string;
    node_id: string | null;
    title: string | null;
    content: string | null;
    note_type: 'general' | 'character' | 'location' | 'timeline';
    created_at: string;
    updated_at: string;
}

// ================================
// UI Types
// ================================

export interface TreeNode {
    id: string;
    title: string;
    type: 'part' | 'chapter' | 'subchapter';
    children: TreeNode[];
    isExpanded?: boolean;
    hasOutline?: boolean;
    hasDraft?: boolean;
    wordCount?: number;
}

export interface BookWithProgress extends Book {
    total_word_count: number;
    outlined_percentage: number;
    drafted_percentage: number;
    node_count: number;
}

export interface EditorState {
    content: string;
    selection: { from: number; to: number } | null;
    wordCount: number;
    isDirty: boolean;
    lastSaved: Date | null;
}

export interface AIAction {
    type: 'outline' | 'write';
    action: string;
    label: string;
    description: string;
}

export interface AIRequest {
    action: string;
    nodeId: string;
    content?: string;
    selection?: string;
    bookProfile: Partial<Book>;
    outline?: Partial<Outline>;
    activePreset?: ResolvedPreset;
    previousChapterSummary?: string;
}

export interface AIResponse {
    content: string;
    changeSummary: string[];
    success: boolean;
    error?: string;
}

export interface ResolvedPreset {
    source: 'book' | 'part' | 'chapter' | 'subchapter' | 'session';
    preset: PromptPreset;
    overrides: Partial<PromptPreset>;
    relativeTone?: {
        enabled: boolean;
        delta: number;
        description: string;
    };
}

// ================================
// Wizard Types
// ================================

export interface BookWizardStep1 {
    title: string;
    is_fiction: boolean;
    genre: string;
}

export interface BookWizardStep2 {
    pov: Book['pov'];
    tense: Book['tense'];
    audience: string;
    target_word_count: number | null;
}

export interface BookWizardStep3 {
    premise: string;
    style_notes: string;
}

export interface BookWizardStep4 {
    default_tone: string;
    tone_intensity: number;
    default_pacing: PromptPreset['pacing'];
    voice_traits: VoiceTraits;
}

export type BookWizardData = BookWizardStep1 & BookWizardStep2 & BookWizardStep3 & BookWizardStep4;

// ================================
// Export Types
// ================================

export interface ExportOptions {
    format: 'markdown' | 'docx';
    includeHeadings: boolean;
    draftedOnly: boolean;
    includeOutlineAppendix: boolean;
}

// ================================
// Constants
// ================================

export const GENRES = {
    fiction: [
        'Fantasy',
        'Science Fiction',
        'Romance',
        'Mystery',
        'Thriller',
        'Horror',
        'Literary Fiction',
        'Historical Fiction',
        'Young Adult',
        'Contemporary',
        'Adventure',
        'Dystopian',
        'Magical Realism',
        'Other',
    ],
    nonfiction: [
        'Memoir',
        'Biography',
        'Self-Help',
        'Business',
        'History',
        'Science',
        'Philosophy',
        'Politics',
        'Travel',
        'True Crime',
        'Health & Wellness',
        'Religion & Spirituality',
        'Other',
    ],
};

export const TONES = [
    'Neutral',
    'Dark',
    'Light',
    'Suspenseful',
    'Romantic',
    'Humorous',
    'Melancholic',
    'Hopeful',
    'Tense',
    'Reflective',
    'Whimsical',
    'Gritty',
];

export const INTENT_TAGS = [
    'World-building',
    'Action',
    'Exposition',
    'Dialogue-heavy',
    'Character development',
    'Emotional climax',
    'Transition',
    'Mystery reveal',
    'Conflict escalation',
    'Resolution',
];

export const POV_OPTIONS: { value: Book['pov']; label: string }[] = [
    { value: 'first', label: 'First Person' },
    { value: 'third-limited', label: 'Third Person Limited' },
    { value: 'third-omniscient', label: 'Third Person Omniscient' },
];

export const TENSE_OPTIONS: { value: Book['tense']; label: string }[] = [
    { value: 'past', label: 'Past Tense' },
    { value: 'present', label: 'Present Tense' },
];

export const PACING_OPTIONS: { value: PromptPreset['pacing']; label: string }[] = [
    { value: 'slow', label: 'Slow' },
    { value: 'medium', label: 'Medium' },
    { value: 'fast', label: 'Fast' },
];

export const VOICE_TRAIT_LABELS: Record<keyof VoiceTraits, string> = {
    concise: 'Concise',
    literary: 'Literary',
    formal: 'Formal',
    gritty: 'Gritty',
    poetic: 'Poetic',
    humorous: 'Humorous',
    dramatic: 'Dramatic',
    minimalist: 'Minimalist',
};

// Convenience exports for genres
export const FICTION_GENRES = GENRES.fiction;
export const NONFICTION_GENRES = GENRES.nonfiction;

// Audience options
export const AUDIENCE_OPTIONS: { value: string; label: string }[] = [
    { value: 'children', label: 'Children' },
    { value: 'middle-grade', label: 'Middle Grade' },
    { value: 'young-adult', label: 'Young Adult' },
    { value: 'new-adult', label: 'New Adult' },
    { value: 'adult', label: 'Adult' },
    { value: 'general', label: 'General Audience' },
];

// ================================
// AI Actions
// ================================

export const OUTLINE_AI_ACTIONS: AIAction[] = [
    {
        type: 'outline',
        action: 'generate',
        label: 'Generate Outline',
        description: 'Create a complete outline for this section',
    },
    {
        type: 'outline',
        action: 'improve',
        label: 'Improve Clarity',
        description: 'Enhance the outline structure and clarity',
    },
    {
        type: 'outline',
        action: 'expand',
        label: 'Generate Sub-outlines',
        description: 'Create outlines for child sections',
    },
];

export const WRITING_AI_ACTIONS: AIAction[] = [
    {
        type: 'write',
        action: 'rewrite',
        label: 'Rewrite',
        description: 'Rewrite while preserving meaning',
    },
    {
        type: 'write',
        action: 'clarify',
        label: 'Make Clearer',
        description: 'Improve clarity and readability',
    },
    {
        type: 'write',
        action: 'shorten',
        label: 'Shorten',
        description: 'Make more concise',
    },
    {
        type: 'write',
        action: 'expand',
        label: 'Expand',
        description: 'Add more detail and depth',
    },
    {
        type: 'write',
        action: 'flow',
        label: 'Improve Flow',
        description: 'Enhance transitions and rhythm',
    },
    {
        type: 'write',
        action: 'tone',
        label: 'Adjust Tone',
        description: 'Match the configured tone preset',
    },
    {
        type: 'write',
        action: 'grammar',
        label: 'Fix Grammar',
        description: 'Correct grammar and spelling',
    },
    {
        type: 'write',
        action: 'continue',
        label: 'Continue Writing',
        description: 'Generate the next paragraph',
    },
    {
        type: 'write',
        action: 'sensory',
        label: 'Add Detail',
        description: 'Add sensory detail (fiction) or examples (nonfiction)',
    },
];
