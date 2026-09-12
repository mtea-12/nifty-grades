CREATE TYPE public.app_role AS ENUM ('admin','guru','wali','siswa');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  nama text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.sekolah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  alamat text NOT NULL DEFAULT '',
  npsn text NOT NULL DEFAULT '',
  kepsek text NOT NULL DEFAULT ''
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sekolah TO authenticated;
GRANT ALL ON public.sekolah TO service_role;
ALTER TABLE public.sekolah ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tahun_ajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun text NOT NULL,
  semester text NOT NULL,
  aktif boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tahun, semester)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tahun_ajaran TO authenticated;
GRANT ALL ON public.tahun_ajaran TO service_role;
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.mata_pelajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text NOT NULL UNIQUE,
  nama text NOT NULL,
  kelompok text NOT NULL DEFAULT 'Umum',
  kkm integer NOT NULL DEFAULT 75,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mata_pelajaran TO authenticated;
GRANT ALL ON public.mata_pelajaran TO service_role;
ALTER TABLE public.mata_pelajaran ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.guru (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  nip text NOT NULL UNIQUE,
  nama text NOT NULL,
  jk text NOT NULL DEFAULT 'L',
  mapel_id uuid REFERENCES public.mata_pelajaran(id) ON DELETE SET NULL,
  telepon text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guru TO authenticated;
GRANT ALL ON public.guru TO service_role;
ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL UNIQUE,
  tingkat text NOT NULL DEFAULT 'X',
  jurusan text NOT NULL DEFAULT '',
  wali_id uuid REFERENCES public.guru(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kelas TO authenticated;
GRANT ALL ON public.kelas TO service_role;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kelas_mapel (
  kelas_id uuid NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  mapel_id uuid NOT NULL REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  PRIMARY KEY (kelas_id, mapel_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kelas_mapel TO authenticated;
GRANT ALL ON public.kelas_mapel TO service_role;
ALTER TABLE public.kelas_mapel ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  nis text NOT NULL UNIQUE,
  nisn text NOT NULL DEFAULT '',
  nama text NOT NULL,
  jk text NOT NULL DEFAULT 'L',
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE SET NULL,
  wali text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siswa TO authenticated;
GRANT ALL ON public.siswa TO service_role;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  mapel_id uuid NOT NULL REFERENCES public.mata_pelajaran(id) ON DELETE CASCADE,
  tahun_ajaran_id uuid NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  tugas integer NOT NULL DEFAULT 0 CHECK (tugas BETWEEN 0 AND 100),
  pts integer NOT NULL DEFAULT 0 CHECK (pts BETWEEN 0 AND 100),
  pas integer NOT NULL DEFAULT 0 CHECK (pas BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (siswa_id, mapel_id, tahun_ajaran_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nilai TO authenticated;
GRANT ALL ON public.nilai TO service_role;
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.guru_saya()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.guru WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.mapel_saya()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mapel_id FROM public.guru WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.siswa_saya()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.siswa WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.kelas_wali_saya()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT k.id FROM public.kelas k
  JOIN public.guru g ON g.id = k.wali_id
  WHERE g.user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.kelas_dari_siswa(_siswa_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT kelas_id FROM public.siswa WHERE id = _siswa_id
$$;

CREATE OR REPLACE FUNCTION public.info_saya()
RETURNS TABLE (user_id uuid, nama text, peran text, guru_id uuid, siswa_id uuid, kelas_wali_id uuid, mapel_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    auth.uid(),
    COALESCE((SELECT p.nama FROM public.profiles p WHERE p.id = auth.uid()), ''),
    COALESCE((SELECT r.role::text FROM public.user_roles r WHERE r.user_id = auth.uid()
      ORDER BY CASE r.role WHEN 'admin' THEN 1 WHEN 'wali' THEN 2 WHEN 'guru' THEN 3 ELSE 4 END LIMIT 1), ''),
    public.guru_saya(), public.siswa_saya(), public.kelas_wali_saya(), public.mapel_saya()
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER nilai_updated_at BEFORE UPDATE ON public.nilai
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nama)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profil sendiri dibaca" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profil sendiri diubah" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "peran sendiri dibaca" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "sekolah dibaca" ON public.sekolah FOR SELECT TO authenticated USING (true);
CREATE POLICY "sekolah dikelola admin" ON public.sekolah FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "tahun ajaran dibaca" ON public.tahun_ajaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "tahun ajaran dikelola admin" ON public.tahun_ajaran FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "mapel dibaca" ON public.mata_pelajaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapel dikelola admin" ON public.mata_pelajaran FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "guru dibaca" ON public.guru FOR SELECT TO authenticated USING (true);
CREATE POLICY "guru dikelola admin" ON public.guru FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "kelas dibaca" ON public.kelas FOR SELECT TO authenticated USING (true);
CREATE POLICY "kelas dikelola admin" ON public.kelas FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "kelas mapel dibaca" ON public.kelas_mapel FOR SELECT TO authenticated USING (true);
CREATE POLICY "kelas mapel dikelola admin" ON public.kelas_mapel FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "siswa dibaca staf dan diri sendiri" ON public.siswa FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'guru')
  OR public.has_role(auth.uid(),'wali')
  OR user_id = auth.uid()
);
CREATE POLICY "siswa dikelola admin" ON public.siswa FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "nilai dibaca sesuai peran" ON public.nilai FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR (public.has_role(auth.uid(),'guru') AND mapel_id = public.mapel_saya())
  OR (public.has_role(auth.uid(),'wali') AND public.kelas_dari_siswa(siswa_id) = public.kelas_wali_saya())
  OR siswa_id = public.siswa_saya()
);
CREATE POLICY "nilai ditulis guru mapel" ON public.nilai FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'guru') AND mapel_id = public.mapel_saya()));
CREATE POLICY "nilai diubah guru mapel" ON public.nilai FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'guru') AND mapel_id = public.mapel_saya()))
WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'guru') AND mapel_id = public.mapel_saya()));
CREATE POLICY "nilai dihapus admin" ON public.nilai FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'));

INSERT INTO public.sekolah (id, nama, alamat, npsn, kepsek) VALUES ('66666666-6666-4666-8666-000000000001','SMK Muhammadiyah 1 Paguyangan','Jl. Raya Paguyangan No. 12, Brebes, Jawa Tengah','20326118','Drs. H. Ahmad Fauzan, M.Pd.');

INSERT INTO public.tahun_ajaran (id, tahun, semester, aktif) VALUES
('55555555-5555-4555-8555-000000000001','2025/2026','Ganjil',true),
('55555555-5555-4555-8555-000000000002','2024/2025','Genap',false),
('55555555-5555-4555-8555-000000000003','2024/2025','Ganjil',false);

INSERT INTO public.mata_pelajaran (id, kode, nama, kelompok, kkm) VALUES
('11111111-1111-4111-8111-000000000001','PAI','Pendidikan Agama Islam & Kemuhammadiyahan','Umum',75),
('11111111-1111-4111-8111-000000000002','PKN','Pendidikan Pancasila','Umum',75),
('11111111-1111-4111-8111-000000000003','BIN','Bahasa Indonesia','Umum',75),
('11111111-1111-4111-8111-000000000004','MTK','Matematika','Umum',72),
('11111111-1111-4111-8111-000000000005','BIG','Bahasa Inggris','Umum',72),
('11111111-1111-4111-8111-000000000006','PJOK','Pendidikan Jasmani dan Olahraga','Umum',75),
('11111111-1111-4111-8111-000000000007','PRO','Pemrograman Dasar','Kejuruan',76),
('11111111-1111-4111-8111-000000000008','JAR','Komputer dan Jaringan Dasar','Kejuruan',76),
('11111111-1111-4111-8111-000000000009','AKL','Akuntansi Dasar','Kejuruan',76),
('11111111-1111-4111-8111-000000000010','BJW','Bahasa Jawa','Muatan Lokal',70);

INSERT INTO public.guru (id, nip, nama, jk, mapel_id, telepon) VALUES
('22222222-2222-4222-8222-000000000001','197805122005011008','Drs. Slamet Riyadi','L','11111111-1111-4111-8111-000000000001','0812-2211-0091'),
('22222222-2222-4222-8222-000000000002','198203142008012011','Siti Aminah, S.Pd.','P','11111111-1111-4111-8111-000000000003','0813-9087-2210'),
('22222222-2222-4222-8222-000000000003','198711202011011005','Budi Santoso, S.Kom.','L','11111111-1111-4111-8111-000000000007','0857-1122-9080'),
('22222222-2222-4222-8222-000000000004','199001152014022003','Rina Widyastuti, S.Pd.','P','11111111-1111-4111-8111-000000000004','0852-3344-1177'),
('22222222-2222-4222-8222-000000000005','198506282010011009','Agus Prasetyo, S.Pd.','L','11111111-1111-4111-8111-000000000005','0821-9911-3344'),
('22222222-2222-4222-8222-000000000006','199209082016012004','Dewi Lestari, S.E.','P','11111111-1111-4111-8111-000000000009','0838-7766-2211'),
('22222222-2222-4222-8222-000000000007','198409192009011007','Muhammad Iqbal, S.Kom.','L','11111111-1111-4111-8111-000000000008','0895-4433-8899'),
('22222222-2222-4222-8222-000000000008','199505232019022001','Nur Hidayah, S.Pd.','P','11111111-1111-4111-8111-000000000002','0813-1200-6677');

INSERT INTO public.kelas (id, nama, tingkat, jurusan, wali_id) VALUES
('33333333-3333-4333-8333-000000000001','X TKJ 1','X','Teknik Komputer dan Jaringan','22222222-2222-4222-8222-000000000003'),
('33333333-3333-4333-8333-000000000002','XI TKJ 1','XI','Teknik Komputer dan Jaringan','22222222-2222-4222-8222-000000000007'),
('33333333-3333-4333-8333-000000000003','XII TKJ 1','XII','Teknik Komputer dan Jaringan','22222222-2222-4222-8222-000000000005'),
('33333333-3333-4333-8333-000000000004','X AKL 1','X','Akuntansi dan Keuangan Lembaga','22222222-2222-4222-8222-000000000006'),
('33333333-3333-4333-8333-000000000005','XI AKL 1','XI','Akuntansi dan Keuangan Lembaga','22222222-2222-4222-8222-000000000002');

INSERT INTO public.kelas_mapel (kelas_id, mapel_id) VALUES
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000001'),
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000002'),
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000003'),
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000004'),
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000005'),
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000006'),
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000007'),
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000008'),
('33333333-3333-4333-8333-000000000001','11111111-1111-4111-8111-000000000010'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000001'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000002'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000003'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000004'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000005'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000006'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000007'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000008'),
('33333333-3333-4333-8333-000000000002','11111111-1111-4111-8111-000000000010'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000001'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000002'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000003'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000004'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000005'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000006'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000007'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000008'),
('33333333-3333-4333-8333-000000000003','11111111-1111-4111-8111-000000000010'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000001'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000002'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000003'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000004'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000005'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000006'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000009'),
('33333333-3333-4333-8333-000000000004','11111111-1111-4111-8111-000000000010'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000001'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000002'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000003'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000004'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000005'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000006'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000009'),
('33333333-3333-4333-8333-000000000005','11111111-1111-4111-8111-000000000010');

INSERT INTO public.siswa (id, nis, nisn, nama, jk, kelas_id, wali) VALUES
('44444444-4444-4444-8444-000000000001','2025001','0071000037','Hanif Nugroho','L','33333333-3333-4333-8333-000000000001','Bpk. Darmawan'),
('44444444-4444-4444-8444-000000000002','2025002','0071000074','Bagas Permata','L','33333333-3333-4333-8333-000000000001','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000003','2025003','0071000111','Zahra Ramadhani','P','33333333-3333-4333-8333-000000000001','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000004','2025004','0071000148','Rizky Maulana','L','33333333-3333-4333-8333-000000000001','Bpk. Darmawan'),
('44444444-4444-4444-8444-000000000005','2025005','0071000185','Fitri Safitri','P','33333333-3333-4333-8333-000000000001','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000006','2025006','0071000222','Vina Ramadhani','P','33333333-3333-4333-8333-000000000001','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000007','2025007','0071000259','Rizky Firmansyah','L','33333333-3333-4333-8333-000000000001','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000008','2025008','0071000296','Mega Azzahra','P','33333333-3333-4333-8333-000000000001','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000009','2025009','0071000333','Reza Saputra','L','33333333-3333-4333-8333-000000000001','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000010','2025010','0071000370','Ahmad Ramadhani','L','33333333-3333-4333-8333-000000000001','Bpk. Darmawan'),
('44444444-4444-4444-8444-000000000011','2025011','0071000407','Nurul Permata','P','33333333-3333-4333-8333-000000000001','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000012','2025012','0071000444','Zahra Pratama','P','33333333-3333-4333-8333-000000000001','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000013','2025013','0071000481','Bagas Pratama','L','33333333-3333-4333-8333-000000000002','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000014','2025014','0071000518','Laila Kusuma','P','33333333-3333-4333-8333-000000000002','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000015','2025015','0071000555','Salsa Hidayat','P','33333333-3333-4333-8333-000000000002','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000016','2025016','0071000592','Rafi Saputra','L','33333333-3333-4333-8333-000000000002','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000017','2025017','0071000629','Siti Nugroho','P','33333333-3333-4333-8333-000000000002','Bpk. Darmawan'),
('44444444-4444-4444-8444-000000000018','2025018','0071000666','Anisa Utami','P','33333333-3333-4333-8333-000000000002','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000019','2025019','0071000703','Ayu Setiawan','P','33333333-3333-4333-8333-000000000002','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000020','2025020','0071000740','Ilham Anggraeni','L','33333333-3333-4333-8333-000000000002','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000021','2025021','0071000777','Tiara Saputra','P','33333333-3333-4333-8333-000000000002','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000022','2025022','0071000814','Ahmad Hidayat','L','33333333-3333-4333-8333-000000000002','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000023','2025023','0071000851','Rahma Azzahra','P','33333333-3333-4333-8333-000000000002','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000024','2025024','0071000888','Putri Ramadhani','P','33333333-3333-4333-8333-000000000002','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000025','2025025','0071000925','Wahyu Anggraeni','L','33333333-3333-4333-8333-000000000003','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000026','2025026','0071000962','Adit Nugroho','L','33333333-3333-4333-8333-000000000003','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000027','2025027','0071000999','Bagas Hidayat','L','33333333-3333-4333-8333-000000000003','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000028','2025028','0071001036','Rahma Hidayat','P','33333333-3333-4333-8333-000000000003','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000029','2025029','0071001073','Rafi Maulana','L','33333333-3333-4333-8333-000000000003','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000030','2025030','0071001110','Fajar Azzahra','L','33333333-3333-4333-8333-000000000003','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000031','2025031','0071001147','Putri Pratama','P','33333333-3333-4333-8333-000000000003','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000032','2025032','0071001184','Yusuf Kusuma','L','33333333-3333-4333-8333-000000000003','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000033','2025033','0071001221','Salsa Nugroho','P','33333333-3333-4333-8333-000000000003','Bpk. Darmawan'),
('44444444-4444-4444-8444-000000000034','2025034','0071001258','Bagas Permata','L','33333333-3333-4333-8333-000000000003','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000035','2025035','0071001295','Zahra Utami','P','33333333-3333-4333-8333-000000000003','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000036','2025036','0071001332','Arif Azzahra','L','33333333-3333-4333-8333-000000000003','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000037','2025037','0071001369','Ahmad Saputra','L','33333333-3333-4333-8333-000000000004','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000038','2025038','0071001406','Siti Firmansyah','P','33333333-3333-4333-8333-000000000004','Bpk. Darmawan'),
('44444444-4444-4444-8444-000000000039','2025039','0071001443','Mega Safitri','P','33333333-3333-4333-8333-000000000004','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000040','2025040','0071001480','Wahyu Ramadhani','L','33333333-3333-4333-8333-000000000004','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000041','2025041','0071001517','Rizky Firmansyah','L','33333333-3333-4333-8333-000000000004','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000042','2025042','0071001554','Mega Ramadhani','P','33333333-3333-4333-8333-000000000004','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000043','2025043','0071001591','Rizky Maulana','L','33333333-3333-4333-8333-000000000004','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000044','2025044','0071001628','Fitri Firmansyah','P','33333333-3333-4333-8333-000000000004','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000045','2025045','0071001665','Mega Setiawan','P','33333333-3333-4333-8333-000000000004','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000046','2025046','0071001702','Ilham Setiawan','L','33333333-3333-4333-8333-000000000004','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000047','2025047','0071001739','Intan Wijaya','P','33333333-3333-4333-8333-000000000004','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000048','2025048','0071001776','Dwi Pratama','P','33333333-3333-4333-8333-000000000004','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000049','2025049','0071001813','Ahmad Nugroho','L','33333333-3333-4333-8333-000000000005','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000050','2025050','0071001850','Anisa Kusuma','P','33333333-3333-4333-8333-000000000005','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000051','2025051','0071001887','Salsa Wijaya','P','33333333-3333-4333-8333-000000000005','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000052','2025052','0071001924','Dimas Ramadhani','L','33333333-3333-4333-8333-000000000005','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000053','2025053','0071001961','Nurul Wijaya','P','33333333-3333-4333-8333-000000000005','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000054','2025054','0071001998','Dwi Utami','P','33333333-3333-4333-8333-000000000005','Bpk. Hartono'),
('44444444-4444-4444-8444-000000000055','2025055','0071002035','Ayu Setiawan','P','33333333-3333-4333-8333-000000000005','Bpk. Mulyadi'),
('44444444-4444-4444-8444-000000000056','2025056','0071002072','Ilham Wijaya','L','33333333-3333-4333-8333-000000000005','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000057','2025057','0071002109','Dwi Anggraeni','P','33333333-3333-4333-8333-000000000005','Bpk. Sutrisno'),
('44444444-4444-4444-8444-000000000058','2025058','0071002146','Tiara Nugroho','P','33333333-3333-4333-8333-000000000005','Bpk. Sukirman'),
('44444444-4444-4444-8444-000000000059','2025059','0071002183','Bagas Anggraeni','L','33333333-3333-4333-8333-000000000005','Bpk. Sugeng'),
('44444444-4444-4444-8444-000000000060','2025060','0071002220','Tiara Firmansyah','P','33333333-3333-4333-8333-000000000005','Bpk. Darmawan');

INSERT INTO public.nilai (siswa_id, mapel_id, tahun_ajaran_id, tugas, pts, pas)
SELECT s.id, km.mapel_id, '55555555-5555-4555-8555-000000000001',
  LEAST(100, 72 + (abs(hashtext(s.id::text || km.mapel_id::text)) % 27)),
  68 + (abs(hashtext(s.id::text || km.mapel_id::text)) % 27),
  CASE WHEN (abs(hashtext(s.id::text || km.mapel_id::text || 'pas')) % 100) > 92 THEN 0
       ELSE LEAST(100, 70 + (abs(hashtext(s.id::text || km.mapel_id::text)) % 27)) END
FROM public.siswa s JOIN public.kelas_mapel km ON km.kelas_id = s.kelas_id;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.guru_saya() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mapel_saya() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.siswa_saya() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kelas_wali_saya() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kelas_dari_siswa(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.info_saya() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.guru_saya() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mapel_saya() TO authenticated;
GRANT EXECUTE ON FUNCTION public.siswa_saya() TO authenticated;
GRANT EXECUTE ON FUNCTION public.kelas_wali_saya() TO authenticated;
GRANT EXECUTE ON FUNCTION public.kelas_dari_siswa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.info_saya() TO authenticated;