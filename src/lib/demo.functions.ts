import { createServerFn } from "@tanstack/react-start";

export type AkunDemo = {
  kunci: "admin" | "guru" | "wali" | "siswa";
  email: string;
  sandi: string;
  nama: string;
  keterangan: string;
};

export const akunDemo: AkunDemo[] = [
  {
    kunci: "admin",
    email: "admin@smkmu1paguyangan.sch.id",
    sandi: "Admin#2026",
    nama: "Administrator Sekolah",
    keterangan: "Kelola data master sekolah",
  },
  {
    kunci: "guru",
    email: "guru@smkmu1paguyangan.sch.id",
    sandi: "Guru#2026",
    nama: "Budi Santoso, S.Kom.",
    keterangan: "Guru Pemrograman Dasar",
  },
  {
    kunci: "wali",
    email: "wali@smkmu1paguyangan.sch.id",
    sandi: "Wali#2026",
    nama: "Muhammad Iqbal, S.Kom.",
    keterangan: "Wali Kelas XI TKJ 1",
  },
  {
    kunci: "siswa",
    email: "siswa@smkmu1paguyangan.sch.id",
    sandi: "Siswa#2026",
    nama: "Bagas Pratama",
    keterangan: "Lihat nilai dan rapor",
  },
];

const GURU_ID = "22222222-2222-4222-8222-000000000003";
const WALI_ID = "22222222-2222-4222-8222-000000000007";
const SISWA_ID = "44444444-4444-4444-8444-000000000013";

/**
 * Menyiapkan empat akun peragaan (admin, guru, wali kelas, siswa) di sistem
 * autentikasi. Kata sandi dikelola dan di-hash oleh layanan autentikasi,
 * tidak pernah disimpan di tabel aplikasi. Aman dipanggil berulang kali.
 */
export const siapkanAkunDemo = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  for (const akun of akunDemo) {
    const { data: daftar } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const ada = daftar?.users.find((u) => u.email?.toLowerCase() === akun.email);

    let userId = ada?.id;
    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: akun.email,
        password: akun.sandi,
        email_confirm: true,
        user_metadata: { nama: akun.nama },
      });
      if (error) throw new Error(`Gagal membuat akun demo ${akun.email}: ${error.message}`);
      userId = data.user?.id;
    }
    if (!userId) continue;

    await supabaseAdmin.from("profiles").upsert({ id: userId, nama: akun.nama });
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: akun.kunci }, { onConflict: "user_id,role" });

    if (akun.kunci === "guru") {
      await supabaseAdmin.from("guru").update({ user_id: userId }).eq("id", GURU_ID);
    } else if (akun.kunci === "wali") {
      await supabaseAdmin.from("guru").update({ user_id: userId }).eq("id", WALI_ID);
    } else if (akun.kunci === "siswa") {
      await supabaseAdmin.from("siswa").update({ user_id: userId }).eq("id", SISWA_ID);
    }
  }

  return { ok: true };
});
