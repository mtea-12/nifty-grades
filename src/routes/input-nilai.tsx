import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, Lencana } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { useNilai } from "@/lib/nilai-store";
import { nilaiAkhir, predikat } from "@/lib/data";
import { useData } from "@/lib/db";

export const Route = createFileRoute("/input-nilai")({
  head: () => ({
    meta: [
      { title: "Input Nilai — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Formulir input nilai tugas, PTS, dan PAS per kelas untuk guru mata pelajaran." },
      { property: "og:title", content: "Input Nilai — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Input nilai tugas, PTS, dan PAS siswa secara cepat per kelas." },
    ],
  }),
  component: InputNilai,
});

function InputNilai() {
  const { guru, kelas, kkmMapel, mapelKelas, namaMapel, siswa } = useData();
  const { akun } = useAuth();
  const { nilai, simpan } = useNilai();
  const g = guru.find((x) => x.id === akun?.refId);
  const kelasDiampu = kelas.filter((k) => (mapelKelas[k.id] ?? []).includes(g?.mapelId ?? ""));
  const [kls, setKls] = React.useState(kelasDiampu[0]?.id ?? "k1");
  const [cari, setCari] = React.useState("");
  const [draf, setDraf] = React.useState<Record<string, { tugas: string; pts: string; pas: string }>>({});

  if (!akun || !g) {
    return (
      <AppLayout judul="Input Nilai">
        <p className="text-sm text-muted-foreground">Halaman ini khusus untuk guru mata pelajaran.</p>
      </AppLayout>
    );
  }

  const mapelId = g.mapelId ?? "";
  const daftar = siswa
    .filter((s) => s.kelasId === kls)
    .filter((s) => s.nama.toLowerCase().includes(cari.toLowerCase()) || s.nis.includes(cari));

  function ambil(siswaId: string) {
    const n = nilai.find((x) => x.siswaId === siswaId && x.mapelId === mapelId);
    const d = draf[siswaId];
    return {
      tugas: d?.tugas ?? String(n?.tugas ?? 0),
      pts: d?.pts ?? String(n?.pts ?? 0),
      pas: d?.pas ?? String(n?.pas ?? 0),
    };
  }

  function ubah(siswaId: string, kolom: "tugas" | "pts" | "pas", v: string) {
    const bersih = v.replace(/[^0-9]/g, "").slice(0, 3);
    if (bersih !== "" && Number(bersih) > 100) return;
    setDraf((d) => ({ ...d, [siswaId]: { ...ambil(siswaId), [kolom]: bersih } }));
  }

  const [menyimpan, setMenyimpan] = React.useState(false);

  function simpanSemua() {
    const ids = Object.keys(draf);
    if (ids.length === 0) {
      toast.info("Belum ada perubahan nilai untuk disimpan.");
      return;
    }
    const baris = ids.map((id) => {
      const d = draf[id] ?? { tugas: "0", pts: "0", pas: "0" };
      return {
        siswaId: id,
        mapelId,
        tugas: Number(d.tugas || 0),
        pts: Number(d.pts || 0),
        pas: Number(d.pas || 0),
      };
    });

    setMenyimpan(true);
    simpan(baris)
      .then(() => {
        setDraf({});
        toast.success(`Nilai ${ids.length} siswa berhasil disimpan.`);
      })
      .catch(() => toast.error("Gagal menyimpan nilai. Coba lagi."))
      .finally(() => setMenyimpan(false));
  }

  const kkm = kkmMapel(mapelId);

  return (
    <AppLayout
      judul="Input Nilai"
      deskripsi={`${namaMapel(mapelId)} · KKM ${kkm}`}
      aksi={
        <button
          onClick={simpanSemua}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-dark sm:px-4"
        >
          <Save className="h-4 w-4" /> <span className="hidden sm:inline">Simpan Nilai</span>
        </button>
      }
    >
      <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
        Bobot nilai akhir: <span className="font-semibold text-foreground">Tugas 30% · PTS 30% · PAS 40%</span>.
        Nilai diisi dalam rentang 0–100.
      </div>

      <PanelTabel
        cari={cari}
        onCari={setCari}
        placeholder="Cari nama siswa atau NIS…"
        filter={
          <Pilih
            label="Pilih kelas"
            nilai={kls}
            onUbah={(v) => {
              setKls(v);
              setDraf({});
            }}
            opsi={kelasDiampu.map((k) => ({ value: k.id, label: k.nama }))}
          />
        }
      >
        <table className="w-full min-w-[820px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>NIS</th>
              <th className={thCls}>Nama Siswa</th>
              <th className={thCls}>Tugas</th>
              <th className={thCls}>PTS</th>
              <th className={thCls}>PAS</th>
              <th className={thCls}>Nilai Akhir</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {daftar.map((s, i) => {
              const v = ambil(s.id);
              const na = nilaiAkhir({
                tugas: Number(v.tugas || 0),
                pts: Number(v.pts || 0),
                pas: Number(v.pas || 0),
              });
              const p = predikat(na);
              return (
                <tr key={s.id} className="hover:bg-secondary/40">
                  <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                  <td className={`${tdCls} font-mono text-xs`}>{s.nis}</td>
                  <td className={`${tdCls} font-medium`}>{s.nama}</td>
                  {(["tugas", "pts", "pas"] as const).map((kolom) => (
                    <td key={kolom} className={tdCls}>
                      <input
                        inputMode="numeric"
                        aria-label={`${kolom} ${s.nama}`}
                        value={v[kolom]}
                        onChange={(e) => ubah(s.id, kolom, e.target.value)}
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
    </AppLayout>
  );
}
