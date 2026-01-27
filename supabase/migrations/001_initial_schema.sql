-- Book Builder Database Schema
-- Run this in your Supabase SQL Editor

-- ================================
-- TABLES
-- ================================

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_fiction BOOLEAN DEFAULT true,
  genre TEXT,
  target_word_count INTEGER,
  pov TEXT CHECK (pov IN ('first', 'third-limited', 'third-omniscient')),
  tense TEXT CHECK (tense IN ('past', 'present')),
  audience TEXT,
  style_notes TEXT,
  premise TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_edited_node_id UUID
);

-- Structure nodes (Parts, Chapters, Subchapters)
CREATE TABLE IF NOT EXISTS structure_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES structure_nodes(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('part', 'chapter', 'subchapter')),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Outlines per node
CREATE TABLE IF NOT EXISTS outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES structure_nodes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  summary TEXT,
  purpose TEXT,
  conflict_or_argument TEXT,
  turning_point TEXT,
  key_characters TEXT,
  setting TEXT,
  open_questions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Drafts per node (current text)
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES structure_nodes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Version history
CREATE TABLE IF NOT EXISTS draft_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  version_type TEXT NOT NULL CHECK (version_type IN ('auto', 'manual', 'ai_checkpoint')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt presets
CREATE TABLE IF NOT EXISTS prompt_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  tone TEXT,
  tone_intensity INTEGER CHECK (tone_intensity >= 1 AND tone_intensity <= 5),
  voice_traits JSONB,
  pacing TEXT CHECK (pacing IN ('slow', 'medium', 'fast')),
  intent_tag TEXT,
  do_rules TEXT,
  dont_rules TEXT,
  pov_constraint TEXT,
  tense_constraint TEXT,
  inspiration_traits TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Node preset overrides
CREATE TABLE IF NOT EXISTS node_preset_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES structure_nodes(id) ON DELETE CASCADE NOT NULL,
  preset_id UUID REFERENCES prompt_presets(id) ON DELETE SET NULL,
  relative_tone_enabled BOOLEAN DEFAULT false,
  relative_tone_delta INTEGER CHECK (relative_tone_delta >= -3 AND relative_tone_delta <= 3),
  overrides JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notes (book-level and node-level)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  node_id UUID REFERENCES structure_nodes(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'character', 'location', 'timeline')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ================================
-- INDEXES
-- ================================

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_structure_nodes_book_id ON structure_nodes(book_id);
CREATE INDEX IF NOT EXISTS idx_structure_nodes_parent_id ON structure_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_outlines_node_id ON outlines(node_id);
CREATE INDEX IF NOT EXISTS idx_drafts_node_id ON drafts(node_id);
CREATE INDEX IF NOT EXISTS idx_draft_versions_draft_id ON draft_versions(draft_id);
CREATE INDEX IF NOT EXISTS idx_prompt_presets_book_id ON prompt_presets(book_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_notes_node_id ON notes(node_id);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

-- Enable RLS on all tables
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE structure_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_preset_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Books: Users can only access their own books
CREATE POLICY "Users can CRUD own books" ON books
  FOR ALL USING (auth.uid() = user_id);

-- Structure nodes: Access through book ownership
CREATE POLICY "Access structure via book" ON structure_nodes
  FOR ALL USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- Outlines: Access through structure node -> book
CREATE POLICY "Access outlines via book" ON outlines
  FOR ALL USING (
    node_id IN (
      SELECT sn.id FROM structure_nodes sn
      JOIN books b ON sn.book_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Drafts: Access through structure node -> book
CREATE POLICY "Access drafts via book" ON drafts
  FOR ALL USING (
    node_id IN (
      SELECT sn.id FROM structure_nodes sn
      JOIN books b ON sn.book_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Draft versions: Access through draft -> structure node -> book
CREATE POLICY "Access draft versions via book" ON draft_versions
  FOR ALL USING (
    draft_id IN (
      SELECT d.id FROM drafts d
      JOIN structure_nodes sn ON d.node_id = sn.id
      JOIN books b ON sn.book_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Prompt presets: Access through book ownership
CREATE POLICY "Access presets via book" ON prompt_presets
  FOR ALL USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- Node preset overrides: Access through structure node -> book
CREATE POLICY "Access preset overrides via book" ON node_preset_overrides
  FOR ALL USING (
    node_id IN (
      SELECT sn.id FROM structure_nodes sn
      JOIN books b ON sn.book_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

-- Notes: Access through book ownership
CREATE POLICY "Access notes via book" ON notes
  FOR ALL USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- ================================
-- TRIGGERS FOR UPDATED_AT
-- ================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_structure_nodes_updated_at
  BEFORE UPDATE ON structure_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outlines_updated_at
  BEFORE UPDATE ON outlines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
