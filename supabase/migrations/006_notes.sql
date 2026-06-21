-- Move notes from browser localStorage into Supabase so they persist
-- across devices and survive clearing browser data.
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paper_id uuid REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);

-- Notes are always queried by paper, so index that lookup.
CREATE INDEX IF NOT EXISTS notes_paper_id_idx ON notes(paper_id);
