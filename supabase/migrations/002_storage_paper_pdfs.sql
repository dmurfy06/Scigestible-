-- Create private storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('paper-pdfs', 'paper-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow users to manage only their own PDFs (stored under their user id as folder)
CREATE POLICY "Users manage own PDFs" ON storage.objects
  FOR ALL USING (
    bucket_id = 'paper-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
