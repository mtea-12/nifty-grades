import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { AppLayout, KartuStat } from "@/components/AppLayout";
import { Lencana } from "@/components/Tabel";
import { useAuth, labelPeran } from "@/lib/auth";
import { useNilai } from "@/lib/nilai-store";
import { nilaiAkhir, predikat } from "@/lib/data";
import { useData } from "@/lib/db";

export const Route = createFileRoute("/dasbor")({
  head: () => ({
    meta: [
      { title: "Dasbor — Sistem Penilaian Akademik SMK Muhammadiyah 1 Paguyangan" },
      {
        name: "description",
        content: "Ringkasan data akademik: jumlah siswa, guru, kelas, dan status penilaian semester berjalan.",
      },
      { property: "og:title", content: "Dasbor — Sistem Penilaian Akademik" },
      { property: "og:description", content: "Ringkasan data akademik sekolah dan status penilaian." },
    ],
  }),
  component: Dasbor,
});

function Dasbor() {
  const { guru, siswa } = useData();
  const { akun } = useAuth();
  const { nilai } = useNilai();
  if (!akun) return <AppLayout judul="Dasbor">{null}</AppLayout>;

  const semua = nilai.map(nilaiAkhir).filter((n) => n > 0);
  const rataSekolah = semua.length ? Math.round(semua.reduce((a, b) => a + b, 0) / semua.length) : 0;
  const belum = nilai.filter((n) => nilaiAkhir(n) === 0).length;

  return (
    <AppLayout
      judul={`Dasbor ${labelPeran[akun.peran]}`}
      deskripsi={`Semester Ganjil · Tahun Pelajaran 2025/2026`}
    >
      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-primary to-primary-dark p-5 text-primary-foreground shadow-sm sm:p-6">
        <p className="text-sm opacity-85">Assalamu'alaikum warahmatullahi wabarakatuh,</p>
        <h2 className="mt-1 font-display text-xl font-bold sm:text-2xl">{akun.nama}</h2>
        <p className="mt-2 max-w-2xl text-sm opacity-90">
          Selamat datang kembali di Sistem Penilaian Akademik SMK Muhammadiyah 1 Paguyangan.
        </p>
      </div>

      {akun.peran === "admin" && (
        <AdminDasbor rataSekolah={rataSekolah} belum={belum} />
      )}
      {akun.peran === "guru" && <GuruDasbor refId={akun.refId!} />}
      {akun.peran === "wali" && <WaliDasbor refId={akun.refId!} />}
      {akun.peran === "siswa" && <SiswaDasbor refId={akun.refId!} />}
    </AppLayout>
  );
}

function AdminDasbor({ rataSekolah, belum }: { rataSekolah: number; belum: number }) {
  const { guru, kelas, mapel, siswa } = useData();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Total Siswa" nilai={siswa.length} ikon={Users} catatan={`${kelas.length} rombel aktif`} />
        <KartuStat label="Total Guru" nilai={guru.length} ikon={GraduationCap} catatan="Guru mata pelajaran" />
        <KartuStat label="Mata Pelajaran" nilai={mapel.length} ikon={BookOpen} catatan="Umum & kejuruan" />
        <KartuStat label="Rata-rata Sekolah" nilai={rataSekolah} ikon={TrendingUp} catatan="Nilai akhir semester" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="font-display text-base font-bold">Sebaran Siswa per Kelas</h3>
          <div className="mt-4 space-y-3">
            {kelas.map((k) => {
              const jml = siswa.filter((s) => s.kelasId === k.id).length;
              return (
                <div key={k.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{k.nama}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{jml} siswa</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(jml / 15) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display text-base font-bold">Status Penilaian</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
              <span>Nilai belum lengkap</span>
              <Lencana jenis={belum ? "peringatan" : "sukses"} anak={`${belum} data`} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2.5">
              <span>Tahun ajaran aktif</span>
              <Lencana jenis="sukses" anak="2025/2026 Ganjil" />
            </div>
            <p className="flex items-start gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              Ingatkan guru mapel untuk melengkapi nilai PAS sebelum pengisian rapor ditutup.
            </p>
          </div>
          <Link
            to="/siswa"
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
          >
            Kelola Data Siswa
          </Link>
        </div>
      </div>
    </>
  );
}

function GuruDasbor({ refId }: { refId: string }) {
  const { guru, kelas, kkmMapel, mapelKelas, namaMapel, siswa } = useData();
  const { nilai } = useNilai();
  const g = guru.find((x) => x.id === refId)!;
  const kelasDiampu = kelas.filter((k) => (mapelKelas[k.id] ?? []).includes(g.mapelId ?? ""));
  const siswaDiampu = siswa.filter((s) => kelasDiampu.some((k) => k.id === s.kelasId));
  const barisNilai = nilai.filter((n) => n.mapelId === g.mapelId);
  const terisi = barisNilai.filter((n) => nilaiAkhir(n) > 0);
  const rata = terisi.length
    ? Math.round(terisi.reduce((a, n) => a + nilaiAkhir(n), 0) / terisi.length)
    : 0;
  const kkm = kkmMapel(g.mapelId);
  const tuntas = terisi.filter((n) => nilaiAkhir(n) >= kkm).length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Mata Pelajaran" nilai={namaMapel(g.mapelId).split(" ")[0]} ikon={BookOpen} catatan={namaMapel(g.mapelId)} />
        <KartuStat label="Kelas Diampu" nilai={kelasDiampu.length} ikon={School} catatan={kelasDiampu.map((k) => k.nama).join(", ")} />
        <KartuStat label="Siswa" nilai={siswaDiampu.length} ikon={Users} catatan="Total siswa diampu" />
        <KartuStat label="Rata-rata Nilai" nilai={rata} ikon={TrendingUp} catatan={`KKM ${kkm} · ${tuntas} tuntas`} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display text-base font-bold">Progres Pengisian Nilai</h3>
          <div className="mt-4 space-y-3">
            {kelasDiampu.map((k) => {
              const daftar = siswa.filter((s) => s.kelasId === k.id);
              const lengkap = daftar.filter((s) => {
                const n = barisNilai.find((x) => x.siswaId === s.id);
                return n && nilaiAkhir(n) > 0;
              }).length;
              const persen = Math.round((lengkap / daftar.length) * 100);
              return (
                <div key={k.id}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{k.nama}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {lengkap}/{daftar.length} · {persen}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-success" style={{ width: `${persen}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            to="/input-nilai"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
          >
            <ClipboardCheck className="h-4 w-4" /> Input Nilai Sekarang
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display text-base font-bold">Agenda Penilaian</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["Penilaian Harian / Tugas", "Berjalan", "sukses"],
              ["Penilaian Tengah Semester (PTS)", "Selesai", "sukses"],
              ["Penilaian Akhir Semester (PAS)", "Input nilai", "peringatan"],
              ["Pengisian Rapor", "Belum dibuka", "netral"],
            ].map(([judul, status, jenis]) => (
              <li key={judul} className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-3 py-2.5">
                <span className="min-w-0 truncate">{judul}</span>
                <Lencana jenis={jenis as "sukses"} anak={status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function WaliDasbor({ refId }: { refId: string }) {
  const { kelas, siswa } = useData();
  const { nilai } = useNilai();
  const k = kelas.find((x) => x.waliId === refId)!;
  const daftar = siswa.filter((s) => s.kelasId === k.id);
  const nilaiKelas = nilai.filter((n) => daftar.some((s) => s.id === n.siswaId));
  const terisi = nilaiKelas.filter((n) => nilaiAkhir(n) > 0);
  const rata = terisi.length ? Math.round(terisi.reduce((a, n) => a + nilaiAkhir(n), 0) / terisi.length) : 0;
  const belum = nilaiKelas.length - terisi.length;

  const peringkat = daftar
    .map((s) => {
      const ns = nilai.filter((n) => n.siswaId === s.id).map(nilaiAkhir).filter((v) => v > 0);
      return { s, rata: ns.length ? Math.round(ns.reduce((a, b) => a + b, 0) / ns.length) : 0 };
    })
    .sort((a, b) => b.rata - a.rata)
    .slice(0, 5);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Kelas Perwalian" nilai={k.nama} ikon={School} catatan={k.jurusan} />
        <KartuStat label="Jumlah Siswa" nilai={daftar.length} ikon={Users} catatan={`${daftar.filter((s) => s.jk === "L").length} L · ${daftar.filter((s) => s.jk === "P").length} P`} />
        <KartuStat label="Rata-rata Kelas" nilai={rata} ikon={TrendingUp} catatan="Seluruh mata pelajaran" />
        <KartuStat label="Nilai Belum Lengkap" nilai={belum} ikon={AlertTriangle} catatan="Perlu ditindaklanjuti" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display text-base font-bold">5 Peringkat Teratas</h3>
          <ol className="mt-4 space-y-2">
            {peringkat.map((p, i) => (
              <li
                key={p.s.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-secondary px-3 py-2.5"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-medium">{p.s.nama}</span>
                <span className="shrink-0 text-sm font-bold">{p.rata}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display text-base font-bold">Tindakan Cepat</h3>
          <div className="mt-4 grid gap-3">
            <Link
              to="/rekap-kelas"
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium hover:border-primary"
            >
              Lihat rekap nilai kelas <ClipboardCheck className="h-4 w-4 text-primary" />
            </Link>
            <Link
              to="/rapor"
              search={{ siswa: "" }}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium hover:border-primary"
            >
              Cetak rapor siswa <FileText className="h-4 w-4 text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function SiswaDasbor({ refId }: { refId: string }) {
  const { kkmMapel, namaKelas, namaMapel, siswa } = useData();
  const { nilai } = useNilai();
  const s = siswa.find((x) => x.id === refId)!;
  const ns = nilai.filter((n) => n.siswaId === s.id);
  const terisi = ns.filter((n) => nilaiAkhir(n) > 0);
  const rata = terisi.length ? Math.round(terisi.reduce((a, n) => a + nilaiAkhir(n), 0) / terisi.length) : 0;
  const tuntas = terisi.filter((n) => nilaiAkhir(n) >= kkmMapel(n.mapelId)).length;
  const p = predikat(rata);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Kelas" nilai={namaKelas(s.kelasId)} ikon={School} catatan={`NIS ${s.nis}`} />
        <KartuStat label="Rata-rata Nilai" nilai={rata} ikon={TrendingUp} catatan={`Predikat ${p.huruf} — ${p.label}`} />
        <KartuStat label="Mapel Tuntas" nilai={`${tuntas}/${ns.length}`} ikon={ClipboardCheck} catatan="Mencapai KKM" />
        <KartuStat label="Mata Pelajaran" nilai={ns.length} ikon={BookOpen} catatan="Semester berjalan" />
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display text-base font-bold">Nilai Terbaru</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ns.slice(0, 6).map((n) => {
            const na = nilaiAkhir(n);
            const kkm = kkmMapel(n.mapelId);
            return (
              <div
                key={n.mapelId}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{namaMapel(n.mapelId)}</p>
                  <p className="text-xs text-muted-foreground">KKM {kkm}</p>
                </div>
                <Lencana jenis={na === 0 ? "netral" : na >= kkm ? "sukses" : "bahaya"} anak={na === 0 ? "-" : na} />
              </div>
            );
          })}
        </div>
        <Link
          to="/nilai-saya"
          className="mt-5 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
        >
          Lihat Semua Nilai
        </Link>
      </div>
    </>
  );
}
