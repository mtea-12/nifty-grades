import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Save, Search, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, KosongTabel, Lencana } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/db";
import { nilaiAkhirSemester, persenHadir, predikat } from "@/lib/data";

export const Route = createFileRoute("/nilai-semester")({
  head: () => ({
    meta: [
      { title: "Nilai Per-semester — SMK Muhammadiyah 1 Paguyangan" },
      {
        name: "description",
        content:
          "Rekap dan input nilai satu siswa untuk satu semester penuh: tugas, PTS, PAS, dan kehadiran.",
      },
      { property: "og:title", content: "Nilai Per-semester — SMK Muhammadiyah 1 Paguyangan" },
      {
        property: "og:description",
        content: "Pilih tahun ajaran dan semester, lalu isi nilai serta kehadiran tiap mata pelajaran.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NilaiPerSemester,
});

type IsiBaris = { tugas: string; pts: string; pas: string; hadir: string; pertemuan: string };
type Draf = Record<string, IsiBaris>;

function NilaiPerSemester() {
  const { kelas, mapel, mapelKelas, kkmMapel, semuaNilai, siswa, simpanNilai, namaKelas, tahunAjaran } =
    useData();
  const { akun } = useAuth();

  const daftarTahun = React.useMemo(
    () => Array.from(new Set(tahunAjaran.map((t) => t.tahun))).sort().reverse(),
    [tahunAjaran],
  );
  const aktif = tahunAjaran.find((t) => t.aktif);

  const [tahun, setTahun] = React.useState("");
  const [semester, setSemester] = React.useState(aktif?.semester ?? "Ganjil");

  React.useEffect(() => {
    if (!tahun && daftarTahun.length > 0) {
      setTahun(aktif?.tahun ?? daftarTahun[0]!);
      if (aktif?.semester) setSemester(aktif.semester);
    }
  }, [tahun, daftarTahun, aktif]);
  const [kls, setKls] = React.useState("semua");
  const [siswaId, setSiswaId] = React.useState("");
  const [cariSiswa, setCariSiswa] = React.useState("");
  const [saranBuka, setSaranBuka] = React.useState(false);
  const [aktifIdx, setAktifIdx] = React.useState(0);
  const [cari, setCari] = React.useState("");
  const [draf, setDraf] = React.useState<Draf>({});
  const [menyimpan, setMenyimpan] = React.useState(false);

  if (akun && akun.peran !== "admin") {
    return (
      <AppLayout judul="Nilai Per-semester">
        <p className="text-sm text-muted-foreground">Halaman ini khusus untuk administrator.</p>
      </AppLayout>
    );
  }

  const ta = tahunAjaran.find((t) => t.tahun === tahun && t.semester === semester) ?? null;
  const nilaiSemester = semuaNilai.filter((n) => n.tahunAjaranId === ta?.id);

  const daftarSiswa = siswa.filter((s) => kls === "semua" || s.kelasId === kls);
  const terpilih = siswa.find((s) => s.id === siswaId) ?? null;

  const kueri = cariSiswa.trim().toLowerCase();
  const saran =
    kueri.length >= 3
      ? daftarSiswa
          .filter((s) => s.nama.toLowerCase().includes(kueri) || s.nis.toLowerCase().includes(kueri))
          .slice(0, 20)
      : [];

  function pilihSiswa(id: string) {
    const s = siswa.find((x) => x.id === id);
    setSiswaId(id);
    setCariSiswa(s ? `${s.nis} · ${s.nama}` : "");
    setSaranBuka(false);
    setDraf({});
  }

  function hapusPilihan() {
    setSiswaId("");
    setCariSiswa("");
    setSaranBuka(false);
    setDraf({});
  }

  const mapelSiswa = terpilih
    ? mapel.filter((m) => {
        const daftar = mapelKelas[terpilih.kelasId ?? ""] ?? [];
        return daftar.length === 0 ? true : daftar.includes(m.id);
      })
    : [];
  const hasil = mapelSiswa.filter(
    (m) =>
      m.nama.toLowerCase().includes(cari.toLowerCase()) || m.kode.toLowerCase().includes(cari.toLowerCase()),
  );

  function ambil(mapelId: string): IsiBaris {
    const n = nilaiSemester.find((x) => x.siswaId === siswaId && x.mapelId === mapelId);
    const d = draf[mapelId];
    return {
      tugas: d?.tugas ?? String(n?.tugas ?? 0),
      pts: d?.pts ?? String(n?.pts ?? 0),
      pas: d?.pas ?? String(n?.pas ?? 0),
      hadir: d?.hadir ?? String(n?.hadir ?? 0),
      pertemuan: d?.pertemuan ?? String(n?.pertemuan ?? 0),
    };
  }

  function ubah(mapelId: string, kolom: keyof IsiBaris, v: string) {
    const batas = kolom === "hadir" || kolom === "pertemuan" ? 3 : 3;
    const bersih = v.replace(/[^0-9]/g, "").slice(0, batas);
    if (kolom !== "hadir" && kolom !== "pertemuan" && bersih !== "" && Number(bersih) > 100) return;
    setDraf((d) => ({ ...d, [mapelId]: { ...ambil(mapelId), [kolom]: bersih } }));
  }

  function simpanSemua() {
    if (!ta) {
      toast.error("Tahun ajaran dan semester tersebut belum tersedia.");
      return;
    }
    if (!terpilih) {
      toast.info("Pilih siswa terlebih dahulu.");
      return;
    }
    const ids = Object.keys(draf);
    if (ids.length === 0) {
      toast.info("Belum ada perubahan untuk disimpan.");
      return;
    }
    const baris = ids.map((mapelId) => {
      const d = draf[mapelId] ?? ambil(mapelId);
      return {
        siswaId: terpilih.id,
        mapelId,
        tugas: Number(d.tugas || 0),
        pts: Number(d.pts || 0),
        pas: Number(d.pas || 0),
        hadir: Number(d.hadir || 0),
        pertemuan: Number(d.pertemuan || 0),
      };
    });
    const salah = baris.find((b) => b.pertemuan > 0 && b.hadir > b.pertemuan);
    if (salah) {
      toast.error("Jumlah hadir tidak boleh melebihi jumlah pertemuan.");
      return;
    }
    setMenyimpan(true);
    simpanNilai(baris, ta.id)
      .then(() => {
        setDraf({});
        toast.success(`Nilai ${ids.length} mata pelajaran tersimpan untuk ${terpilih.nama}.`);
      })
      .catch((e) => toast.error((e as Error).message || "Gagal menyimpan nilai."))
      .finally(() => setMenyimpan(false));
  }

  const semuaNA = hasil.map((m) => {
    const v = ambil(m.id);
    return nilaiAkhirSemester({
      tugas: Number(v.tugas || 0),
      pts: Number(v.pts || 0),
      pas: Number(v.pas || 0),
      hadir: Number(v.hadir || 0),
      pertemuan: Number(v.pertemuan || 0),
    });
  });
  const terisi = semuaNA.filter((n) => n > 0);
  const rata = terisi.length > 0 ? Math.round(terisi.reduce((a, b) => a + b, 0) / terisi.length) : 0;

  return (
    <AppLayout
      judul="Nilai Per-semester"
      deskripsi={
        terpilih ? `${terpilih.nama} · ${tahun} ${semester}` : "Pilih tahun ajaran, semester, lalu siswa"
      }
      aksi={
        <button
          onClick={simpanSemua}
          disabled={menyimpan}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60 sm:px-4"
        >
          <Save className="h-4 w-4" />{" "}
          <span className="hidden sm:inline">{menyimpan ? "Menyimpan…" : "Simpan Nilai"}</span>
        </button>
      }
    >
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <Pilih
          label="Tahun ajaran"
          nilai={tahun}
          onUbah={(v) => {
            setTahun(v);
            setDraf({});
          }}
          opsi={daftarTahun.map((t) => ({ value: t, label: t }))}
        />
        <Pilih
          label="Semester"
          nilai={semester}
          onUbah={(v) => {
            setSemester(v);
            setDraf({});
          }}
          opsi={[
            { value: "Ganjil", label: "Semester Ganjil" },
            { value: "Genap", label: "Semester Genap" },
          ]}
        />
        <Pilih
          label="Filter kelas"
          nilai={kls}
          onUbah={(v) => {
            setKls(v);
            hapusPilihan();
          }}
          opsi={[{ value: "semua", label: "Semua Kelas" }, ...kelas.map((k) => ({ value: k.id, label: k.nama }))]}
        />
        <div className="relative flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground">Cari siswa</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={cariSiswa}
              placeholder="Ketik min. 3 huruf nama/NIS siswa…"
              aria-label="Cari siswa"
              onFocus={() => setSaranBuka(true)}
              onBlur={() => setTimeout(() => setSaranBuka(false), 150)}
              onChange={(e) => {
                setCariSiswa(e.target.value);
                setSiswaId("");
                setDraf({});
                setAktifIdx(0);
                setSaranBuka(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && saran.length > 0) {
                  e.preventDefault();
                  setSaranBuka(true);
                  setAktifIdx((i) => (i + 1) % saran.length);
                } else if (e.key === "ArrowUp" && saran.length > 0) {
                  e.preventDefault();
                  setAktifIdx((i) => (i - 1 + saran.length) % saran.length);
                } else if (e.key === "Enter" && saranBuka && saran[aktifIdx]) {
                  e.preventDefault();
                  pilihSiswa(saran[aktifIdx].id);
                } else if (e.key === "Escape") {
                  setSaranBuka(false);
                }
              }}
              className="w-full min-w-64 rounded-lg border border-input bg-background py-2 pl-8 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
            {siswaId && (
              <button
                type="button"
                aria-label="Hapus pilihan siswa"
                onClick={hapusPilihan}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {kueri.length > 0 && kueri.length < 3 && (
            <span className="text-xs text-muted-foreground">Ketik minimal 3 huruf untuk mencari…</span>
          )}
          {saranBuka && kueri.length >= 3 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-card shadow-lg">
              {saran.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Siswa tidak ditemukan.</li>
              )}
              {saran.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pilihSiswa(s.id)}
                    onMouseEnter={() => setAktifIdx(i)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                      i === aktifIdx ? "bg-secondary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <span>
                      <span className="font-mono text-xs font-semibold">{s.nis}</span> · {s.nama}
                    </span>
                    <span className="text-xs text-muted-foreground">{namaKelas(s.kelasId)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Bobot: Tugas 20% · PTS 20% · PAS 30% · Absensi 30%</p>
      </div>

      {!ta && (
        <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          Semester {semester} untuk tahun ajaran {tahun || "-"} belum ada. Tambahkan dulu di halaman Tahun
          Ajaran.
        </div>
      )}

      {terpilih && ta && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Rata-rata semester
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{rata || "-"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {terisi.length} dari {hasil.length} mata pelajaran sudah lengkap.
          </p>
        </div>
      )}

      <PanelTabel cari={cari} onCari={setCari} placeholder="Cari mata pelajaran…">
        <table className="w-full min-w-[1020px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>Kode</th>
              <th className={thCls}>Mata Pelajaran</th>
              <th className={thCls}>KKM</th>
              <th className={thCls}>Tugas</th>
              <th className={thCls}>PTS</th>
              <th className={thCls}>PAS</th>
              <th className={thCls}>Hadir</th>
              <th className={thCls}>Pertemuan</th>
              <th className={thCls}>Kehadiran</th>
              <th className={thCls}>Nilai Akhir</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!terpilih && <KosongTabel pesan="Pilih siswa terlebih dahulu untuk mengisi nilai." />}
            {terpilih && hasil.length === 0 && <KosongTabel pesan="Mata pelajaran tidak ditemukan." />}
            {terpilih &&
              hasil.map((m, i) => {
                const v = ambil(m.id);
                const hadir = Number(v.hadir || 0);
                const pertemuan = Number(v.pertemuan || 0);
                const absen = persenHadir(hadir, pertemuan);
                const na = nilaiAkhirSemester({
                  tugas: Number(v.tugas || 0),
                  pts: Number(v.pts || 0),
                  pas: Number(v.pas || 0),
                  hadir,
                  pertemuan,
                });
                const kkm = kkmMapel(m.id);
                const p = predikat(na);
                const hadirSalah = pertemuan > 0 && hadir > pertemuan;
                return (
                  <tr key={m.id} className="hover:bg-secondary/40">
                    <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                    <td className={`${tdCls} font-mono text-xs font-semibold`}>{m.kode}</td>
                    <td className={`${tdCls} whitespace-normal font-medium`}>{m.nama}</td>
                    <td className={tdCls}>{kkm}</td>
                    {(["tugas", "pts", "pas", "hadir", "pertemuan"] as const).map((kolom) => (
                      <td key={kolom} className={tdCls}>
                        <input
                          inputMode="numeric"
                          aria-label={`${kolom} ${m.nama}`}
                          value={v[kolom]}
                          onChange={(e) => ubah(m.id, kolom, e.target.value)}
                          className={`w-18 rounded-lg border bg-background px-2 py-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-ring/30 ${
                            kolom === "hadir" && hadirSalah
                              ? "border-destructive"
                              : "border-input focus:border-primary"
                          }`}
                        />
                      </td>
                    ))}
                    <td className={tdCls}>{pertemuan > 0 ? `${absen}%` : "-"}</td>
                    <td className={`${tdCls} font-display text-base font-bold`}>{na || "-"}</td>
                    <td className={tdCls}>
                      <Lencana
                        jenis={na === 0 ? "netral" : na >= kkm ? "sukses" : "bahaya"}
                        anak={na === 0 ? "Belum lengkap" : na >= kkm ? `Tuntas (${p.huruf})` : "Remedial"}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </PanelTabel>
    </AppLayout>
  );
}
