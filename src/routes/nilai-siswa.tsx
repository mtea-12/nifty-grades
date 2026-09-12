import * as React from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Download, Save, Upload } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, KosongTabel, Lencana } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/db";
import { nilaiAkhir, predikat } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bacaBerkas, cocokkan, keNilai, unduhTemplate, type BarisImpor } from "@/lib/impor-nilai";

export const Route = createFileRoute("/nilai-siswa")({
  validateSearch: (s: Record<string, unknown>) => ({ siswa: typeof s['siswa'] === "string" ? s['siswa'] : undefined }),
  head: () => ({
    meta: [
      { title: "Nilai per Siswa — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Input nilai tugas, PTS, dan PAS setiap mata pelajaran untuk satu siswa." },
      { property: "og:title", content: "Nilai per Siswa — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Admin dapat mengisi nilai tiap mata pelajaran per siswa secara manual." },
    ],
  }),
  component: NilaiPerSiswa,
});

type Draf = Record<string, { tugas: string; pts: string; pas: string }>;

function NilaiPerSiswa() {
  const { kelas, mapel, mapelKelas, kkmMapel, nilai, siswa, simpanNilai } = useData();
  const { akun } = useAuth();
  const search = useSearch({ from: "/nilai-siswa" });

  const [kls, setKls] = React.useState("semua");
  const [siswaId, setSiswaId] = React.useState<string>(search.siswa ?? "");
  const [cari, setCari] = React.useState("");
  const [draf, setDraf] = React.useState<Draf>({});
  const [menyimpan, setMenyimpan] = React.useState(false);
  const [imporBuka, setImporBuka] = React.useState(false);
  const [imporBaris, setImporBaris] = React.useState<BarisImpor[]>([]);
  const [namaBerkas, setNamaBerkas] = React.useState("");
  const [mengimpor, setMengimpor] = React.useState(false);
  const inputBerkas = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (search.siswa) {
      setSiswaId(search.siswa);
      const s = siswa.find((x) => x.id === search.siswa);
      if (s?.kelasId) setKls(s.kelasId);
    }
  }, [search.siswa, siswa]);

  if (akun && akun.peran !== "admin") {
    return (
      <AppLayout judul="Nilai per Siswa">
        <p className="text-sm text-muted-foreground">Halaman ini khusus untuk administrator.</p>
      </AppLayout>
    );
  }

  const daftarSiswa = siswa.filter((s) => kls === "semua" || s.kelasId === kls);
  const terpilih = siswa.find((s) => s.id === siswaId) ?? null;

  const mapelSiswa = terpilih
    ? mapel.filter((m) => {
        const daftar = mapelKelas[terpilih.kelasId ?? ""] ?? [];
        return daftar.length === 0 ? true : daftar.includes(m.id);
      })
    : [];
  const hasil = mapelSiswa.filter(
    (m) => m.nama.toLowerCase().includes(cari.toLowerCase()) || m.kode.toLowerCase().includes(cari.toLowerCase()),
  );

  function ambil(mapelId: string) {
    const n = nilai.find((x) => x.siswaId === siswaId && x.mapelId === mapelId);
    const d = draf[mapelId];
    return {
      tugas: d?.tugas ?? String(n?.tugas ?? 0),
      pts: d?.pts ?? String(n?.pts ?? 0),
      pas: d?.pas ?? String(n?.pas ?? 0),
    };
  }

  function ubah(mapelId: string, kolom: "tugas" | "pts" | "pas", v: string) {
    const bersih = v.replace(/[^0-9]/g, "").slice(0, 3);
    if (bersih !== "" && Number(bersih) > 100) return;
    setDraf((d) => ({ ...d, [mapelId]: { ...ambil(mapelId), [kolom]: bersih } }));
  }

  function simpanSemua() {
    if (!terpilih) {
      toast.info("Pilih siswa terlebih dahulu.");
      return;
    }
    const ids = Object.keys(draf);
    if (ids.length === 0) {
      toast.info("Belum ada perubahan nilai untuk disimpan.");
      return;
    }
    const baris = ids.map((mapelId) => {
      const d = draf[mapelId] ?? { tugas: "0", pts: "0", pas: "0" };
      return {
        siswaId: terpilih.id,
        mapelId,
        tugas: Number(d.tugas || 0),
        pts: Number(d.pts || 0),
        pas: Number(d.pas || 0),
      };
    });
    setMenyimpan(true);
    simpanNilai(baris)
      .then(() => {
        setDraf({});
        toast.success(`Nilai ${ids.length} mata pelajaran tersimpan untuk ${terpilih.nama}.`);
      })
      .catch((e) => toast.error((e as Error).message || "Gagal menyimpan nilai."))
      .finally(() => setMenyimpan(false));
  }

  async function pilihBerkas(f: File | null) {
    if (!f) return;
    try {
      const mentah = await bacaBerkas(f);
      const hasilCocok = cocokkan(mentah, siswa, mapel);
      setNamaBerkas(f.name);
      setImporBaris(hasilCocok);
      if (hasilCocok.length === 0) toast.error("Berkas tidak berisi data yang bisa dibaca.");
    } catch (e) {
      toast.error((e as Error).message || "Berkas tidak bisa dibaca.");
    }
  }

  function simpanImpor() {
    const baris = keNilai(imporBaris);
    if (baris.length === 0) {
      toast.error("Tidak ada baris yang cocok dengan data siswa dan mata pelajaran.");
      return;
    }
    setMengimpor(true);
    simpanNilai(baris)
      .then(() => {
        toast.success(`${baris.length} nilai berhasil diimpor.`);
        setImporBuka(false);
        setImporBaris([]);
        setNamaBerkas("");
        setDraf({});
      })
      .catch((e) => toast.error((e as Error).message || "Gagal menyimpan nilai."))
      .finally(() => setMengimpor(false));
  }

  const valid = imporBaris.filter((b) => !b.pesan);
  const gagal = imporBaris.filter((b) => b.pesan);

  return (
    <AppLayout
      judul="Nilai per Siswa"
      deskripsi={terpilih ? `${terpilih.nama} · NIS ${terpilih.nis}` : "Pilih siswa untuk mulai mengisi nilai"}
      aksi={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImporBuka(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-secondary/60 sm:px-4"
          >
            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Impor Excel/CSV</span>
          </button>
          <button
            onClick={simpanSemua}
            disabled={menyimpan}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60 sm:px-4"
          >
            <Save className="h-4 w-4" /> <span className="hidden sm:inline">{menyimpan ? "Menyimpan…" : "Simpan Nilai"}</span>
          </button>
        </div>
      }
    >
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <Pilih
          label="Filter kelas"
          nilai={kls}
          onUbah={(v) => {
            setKls(v);
            setSiswaId("");
            setDraf({});
          }}
          opsi={[{ value: "semua", label: "Semua Kelas" }, ...kelas.map((k) => ({ value: k.id, label: k.nama }))]}
        />
        <Pilih
          label="Pilih siswa"
          nilai={siswaId}
          onUbah={(v) => {
            setSiswaId(v);
            setDraf({});
          }}
          opsi={[
            { value: "", label: "— Pilih siswa —" },
            ...daftarSiswa.map((s) => ({ value: s.id, label: `${s.nis} · ${s.nama}` })),
          ]}
        />
        <p className="text-sm text-muted-foreground">Bobot: Tugas 30% · PTS 30% · PAS 40%</p>
      </div>

      <PanelTabel cari={cari} onCari={setCari} placeholder="Cari mata pelajaran…">
        <table className="w-full min-w-[820px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>Kode</th>
              <th className={thCls}>Mata Pelajaran</th>
              <th className={thCls}>KKM</th>
              <th className={thCls}>Tugas</th>
              <th className={thCls}>PTS</th>
              <th className={thCls}>PAS</th>
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
                const na = nilaiAkhir({ tugas: Number(v.tugas || 0), pts: Number(v.pts || 0), pas: Number(v.pas || 0) });
                const kkm = kkmMapel(m.id);
                const p = predikat(na);
                return (
                  <tr key={m.id} className="hover:bg-secondary/40">
                    <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                    <td className={`${tdCls} font-mono text-xs font-semibold`}>{m.kode}</td>
                    <td className={`${tdCls} whitespace-normal font-medium`}>{m.nama}</td>
                    <td className={tdCls}>{kkm}</td>
                    {(["tugas", "pts", "pas"] as const).map((kolom) => (
                      <td key={kolom} className={tdCls}>
                        <input
                          inputMode="numeric"
                          aria-label={`${kolom} ${m.nama}`}
                          value={v[kolom]}
                          onChange={(e) => ubah(m.id, kolom, e.target.value)}
                          className="w-18 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                        />
                      </td>
                    ))}
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

      <Dialog
        open={imporBuka}
        onOpenChange={(o) => {
          setImporBuka(o);
          if (!o) {
            setImporBaris([]);
            setNamaBerkas("");
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Impor Nilai dari Excel/CSV</DialogTitle>
            <DialogDescription>
              Berkas harus memiliki kolom: <span className="font-mono">nis</span>,{" "}
              <span className="font-mono">kode_mapel</span>, <span className="font-mono">tugas</span>,{" "}
              <span className="font-mono">pts</span>, <span className="font-mono">pas</span>. Satu baris untuk satu
              siswa pada satu mata pelajaran.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputBerkas}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                void pilihBerkas(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" onClick={() => inputBerkas.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Pilih berkas
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                unduhTemplate(
                  (daftarSiswa.length > 0 ? daftarSiswa : siswa).slice(0, 3).flatMap((s) =>
                    mapel.slice(0, 3).map((m) => ({ nis: s.nis, kode: m.kode })),
                  ),
                )
              }
            >
              <Download className="mr-2 h-4 w-4" /> Unduh template
            </Button>
            {namaBerkas && <span className="text-sm text-muted-foreground">{namaBerkas}</span>}
          </div>

          {imporBaris.length > 0 && (
            <>
              <p className="text-sm">
                <span className="font-semibold text-success">{valid.length} baris siap disimpan</span>
                {gagal.length > 0 && <span className="text-destructive"> · {gagal.length} baris dilewati</span>}
              </p>
              <div className="max-h-64 overflow-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-secondary/60">
                    <tr>
                      <th className={thCls}>NIS</th>
                      <th className={thCls}>Siswa</th>
                      <th className={thCls}>Mapel</th>
                      <th className={thCls}>Tugas</th>
                      <th className={thCls}>PTS</th>
                      <th className={thCls}>PAS</th>
                      <th className={thCls}>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {imporBaris.slice(0, 200).map((b) => (
                      <tr key={b.no} className={b.pesan ? "bg-destructive/5" : ""}>
                        <td className={`${tdCls} font-mono text-xs`}>{b.nis || "-"}</td>
                        <td className={tdCls}>{b.namaSiswa}</td>
                        <td className={tdCls}>{b.namaMapel}</td>
                        <td className={tdCls}>{b.tugas}</td>
                        <td className={tdCls}>{b.pts}</td>
                        <td className={tdCls}>{b.pas}</td>
                        <td className={tdCls}>
                          <Lencana jenis={b.pesan ? "bahaya" : "sukses"} anak={b.pesan ?? "Siap"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {imporBaris.length > 200 && (
                <p className="text-xs text-muted-foreground">Menampilkan 200 baris pertama dari {imporBaris.length}.</p>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setImporBuka(false)}>
              Batal
            </Button>
            <Button type="button" onClick={simpanImpor} disabled={mengimpor || valid.length === 0}>
              {mengimpor ? "Menyimpan…" : `Simpan ${valid.length} nilai`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
