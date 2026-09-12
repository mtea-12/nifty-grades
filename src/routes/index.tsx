import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { GraduationCap, LogIn, ShieldCheck } from "lucide-react";
import { useAuth, akunDemo, labelPeran } from "@/lib/auth";
import { siapkanAkunDemo } from "@/lib/demo.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Masuk — Sistem Penilaian Akademik SMK Muhammadiyah 1 Paguyangan" },
      {
        name: "description",
        content:
          "Halaman masuk sistem penilaian akademik SMK Muhammadiyah 1 Paguyangan untuk admin, guru, wali kelas, dan siswa.",
      },
      { property: "og:title", content: "Masuk — Sistem Penilaian Akademik SMK Muhammadiyah 1 Paguyangan" },
      {
        property: "og:description",
        content: "Masuk sebagai admin, guru, wali kelas, atau siswa untuk mengelola dan melihat nilai.",
      },
    ],
  }),
  component: HalamanMasuk,
});

function HalamanMasuk() {
  const { masuk, akun, siap } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = React.useState("");
  const [sandi, setSandi] = React.useState("");
  const [proses, setProses] = React.useState(false);

  React.useEffect(() => {
    if (siap && akun) navigate({ to: "/dasbor", replace: true });
  }, [siap, akun, navigate]);

  async function cobaMasuk(email: string, kataSandi: string) {
    setProses(true);
    try {
      let hasil = await masuk(email, kataSandi);
      const demo = akunDemo.some((a) => a.email === email.trim().toLowerCase() && a.sandi === kataSandi);
      if (!hasil.ok && demo) {
        // Akun peragaan dibuat sekali di sisi server (kata sandi di-hash layanan autentikasi).
        await siapkanAkunDemo();
        hasil = await masuk(email, kataSandi);
      }
      if (!hasil.ok) {
        toast.error(hasil.pesan ?? "Gagal masuk.");
        return;
      }
      toast.success("Berhasil masuk. Selamat datang!");
      navigate({ to: "/dasbor" });
    } catch {
      toast.error("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setProses(false);
    }
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    void cobaMasuk(username, sandi);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <span className="font-display text-xl font-bold">M</span>
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">SMK Muhammadiyah 1</p>
            <p className="text-sm opacity-80">Paguyangan, Brebes</p>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Sistem Penilaian Akademik
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-85">
            Satu tempat untuk mengelola data siswa, menginput nilai tugas, PTS, dan PAS, memantau rekap
            kelas, hingga mencetak rapor siswa dengan rapi.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Input nilai cepat per kelas dan mata pelajaran",
              "Rekap otomatis dan status kelengkapan nilai",
              "Rapor siap cetak dengan identitas sekolah",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-primary" />
                <span className="opacity-90">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-70">Jl. Raya Paguyangan, Brebes, Jawa Tengah</p>
      </section>

      <section className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display font-bold">SMK Muhammadiyah 1 Paguyangan</p>
              <p className="text-xs text-muted-foreground">Sistem Penilaian Akademik</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h1 className="font-display text-2xl font-bold">Masuk ke akun Anda</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gunakan akun yang diberikan sekolah untuk melanjutkan.
            </p>

            <form onSubmit={kirim} className="mt-6 space-y-4">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={40}
                  required
                  type="email"
                  autoComplete="username"
                  placeholder="mis. guru@smkmu1paguyangan.sch.id"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label htmlFor="sandi" className="mb-1.5 block text-sm font-medium">
                  Kata Sandi
                </label>
                <input
                  id="sandi"
                  type="password"
                  value={sandi}
                  onChange={(e) => setSandi(e.target.value)}
                  maxLength={64}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <button
                type="submit"
                disabled={proses}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" /> {proses ? "Memproses…" : "Masuk"}
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/60 p-5">
            <p className="text-sm font-semibold">Akun demo — klik untuk langsung masuk</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Akun dibuat otomatis pada pemakaian pertama dan tersimpan permanen.
            </p>
            <div className="mt-3 grid gap-2">
              {akunDemo.map((a) => (
                <button
                  key={a.kunci}
                  type="button"
                  disabled={proses}
                  onClick={() => {
                    setUsername(a.email);
                    setSandi(a.sandi);
                    void cobaMasuk(a.email, a.sandi);
                  }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{labelPeran[a.kunci]}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.keterangan}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
                    {a.kunci} / {a.sandi}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
