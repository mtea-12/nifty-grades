CREATE TABLE public.log_aksi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabel text NOT NULL,
  aksi text NOT NULL,
  ringkasan text NOT NULL DEFAULT '',
  baris_id uuid,
  pelaku_id uuid,
  pelaku_nama text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.log_aksi TO authenticated;
GRANT ALL ON public.log_aksi TO service_role;

ALTER TABLE public.log_aksi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "log dibaca admin" ON public.log_aksi
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX log_aksi_created_at_idx ON public.log_aksi (created_at DESC);

CREATE OR REPLACE FUNCTION public.catat_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nama text;
  v_ringkas text;
  v_baris uuid;
  r record;
BEGIN
  r := COALESCE(NEW, OLD);
  v_baris := r.id;
  SELECT COALESCE(p.nama, '') INTO v_nama FROM public.profiles p WHERE p.id = auth.uid();

  IF TG_TABLE_NAME = 'mata_pelajaran' THEN
    v_ringkas := COALESCE(r.kode, '') || ' — ' || COALESCE(r.nama, '');
  ELSIF TG_TABLE_NAME = 'guru' THEN
    v_ringkas := COALESCE(r.nama, '') || ' (NIP ' || COALESCE(r.nip, '') || ')';
  ELSIF TG_TABLE_NAME = 'nilai' THEN
    v_ringkas := COALESCE((SELECT s.nama FROM public.siswa s WHERE s.id = r.siswa_id), '?')
      || ' — ' || COALESCE((SELECT m.nama FROM public.mata_pelajaran m WHERE m.id = r.mapel_id), '?')
      || ' (T' || COALESCE(r.tugas, 0) || '/P' || COALESCE(r.pts, 0) || '/A' || COALESCE(r.pas, 0) || ')';
  ELSE
    v_ringkas := '';
  END IF;

  INSERT INTO public.log_aksi (tabel, aksi, ringkasan, baris_id, pelaku_id, pelaku_nama)
  VALUES (
    TG_TABLE_NAME,
    CASE TG_OP WHEN 'INSERT' THEN 'tambah' WHEN 'UPDATE' THEN 'ubah' ELSE 'hapus' END,
    v_ringkas,
    v_baris,
    auth.uid(),
    COALESCE(NULLIF(v_nama, ''), 'Sistem')
  );

  RETURN r;
END;
$$;

CREATE TRIGGER log_mata_pelajaran
  AFTER INSERT OR UPDATE OR DELETE ON public.mata_pelajaran
  FOR EACH ROW EXECUTE FUNCTION public.catat_log();

CREATE TRIGGER log_guru
  AFTER INSERT OR UPDATE OR DELETE ON public.guru
  FOR EACH ROW EXECUTE FUNCTION public.catat_log();

CREATE TRIGGER log_nilai
  AFTER INSERT OR UPDATE OR DELETE ON public.nilai
  FOR EACH ROW EXECUTE FUNCTION public.catat_log();