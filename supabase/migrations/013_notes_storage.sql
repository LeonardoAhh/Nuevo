-- ============================================================
-- 013: Bucket de Supabase Storage para adjuntos de notas
-- ============================================================

-- Crear bucket público para adjuntos de notas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notes-attachments',
  'notes-attachments',
  true,
  10485760,   -- 10 MB por archivo
  null        -- todos los tipos MIME permitidos
)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquier usuario autenticado puede subir archivos
CREATE POLICY "notes_attachments_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'notes-attachments'
    AND auth.uid() IS NOT NULL
  );

-- Política: lectura pública (el bucket es público)
CREATE POLICY "notes_attachments_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'notes-attachments');

-- Política: solo el dueño del archivo puede eliminarlo
-- El path tiene formato: {user_id}/{filename}
CREATE POLICY "notes_attachments_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'notes-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
