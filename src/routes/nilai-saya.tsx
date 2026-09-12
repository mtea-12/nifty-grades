import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, KartuStat } from "@/components/AppLayout";
import { PanelTabel, thCls, tdCls, Lencana } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { useNilai } from "@/lib/nilai-store";
import { nilaiAkhir, predikat } from "@/lib/data";
import { useData } from "@/lib/db";
import { TrendingUp, CheckCircle2, BookOpen } from "lucide-react";

export const Route = createFileRoute("/nilai-saya")({
  head: () => ({
    meta: [
      { title: "Nilai Saya — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Halaman siswa untuk melihat nilai tugas, PTS, PAS, dan nilai akhir tiap mata pelajaran." },
      { property: "og:title", content: "Nilai Saya — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Lihat perkembangan nilai per mata pelajaran secara transparan." },
    ],
  }),
  component: NilaiSaya,
});

function NilaiSaya() {
  const { kkmMapel, namaKelas, namaMapel, siswa } = useData();
  const { akun } = useAuth();
  const { nilai } = useNilai();
  const s = siswa.find((x) => x.id === akun?.refId);

  if (!akun || !s) {
    return (
      <AppLayout judul="Nilai Saya">
        <p className="text-sm text-muted-foreground">Halaman ini khusus untuk siswa.</p>
      </AppLayout>
    );
  }

  const ns = nilai.filter((n) => n.siswaId === s.id);
  const terisi = ns.filter((n) => nilaiAkhir(n) > 0);
  const rata = terisi.length ? Math.round(terisi.reduce((a, n) => a + nilaiAkhir(n), 0) / terisi.length) : 0;
  const tuntas = terisi.filter((n) => nilaiAkhir(n) >= kkmMapel(n.mapelId)).length;

  return (
    <AppLayout judul="Nilai Saya" deskripsi={`${s.nama} · ${namaKelas(s.kelasId)} · NIS ${s.nis}`}>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KartuStat label="Rata-rata" nilai={rata} ikon={TrendingUp} catatan={`Predikat ${predikat(rata).huruf}`} />
        <KartuStat label="Mapel Tuntas" nilai={`${tuntas}/${ns.length}`} ikon={CheckCircle2} catatan="Mencapai KKM" />
        <KartuStat label="Mata Pelajaran" nilai={ns.length} ikon={BookOpen} catatan="Semester Ganjil 2025/2026" />
      </div>

      <PanelTabel>
        <table className="w-full min-w-[760px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>Mata Pelajaran</th>
              <th className={thCls}>KKM</th>
              <th className={thCls}>Tugas</th>
              <th className={thCls}>PTS</th>
              <th className={thCls}>PAS</th>
              <th className={thCls}>Nilai Akhir</th>
              <th className={thCls}>Predikat</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ns.map((n, i) => {
              const na = nilaiAkhir(n);
              const kkm = kkmMapel(n.mapelId);
              const p = predikat(na);
              return (
                <tr key={n.mapelId} className="hover:bg-secondary/40">
                  <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                  <td className={`${tdCls} whitespace-normal font-medium`}>{namaMapel(n.mapelId)}</td>
                  <td className={tdCls}>{kkm}</td>
                  <td className={tdCls}>{n.tugas || "-"}</td>
                  <td className={tdCls}>{n.pts || "-"}</td>
                  <td className={tdCls}>{n.pas || "-"}</td>
                  <td className={`${tdCls} font-display text-base font-bold`}>{na || "-"}</td>
                  <td className={tdCls}>
                    {p.huruf} <span className="text-xs text-muted-foreground">({p.label})</span>
                  </td>
                  <td className={tdCls}>
                    <Lencana
                      jenis={na === 0 ? "netral" : na >= kkm ? "sukses" : "bahaya"}
                      anak={na === 0 ? "Belum dinilai" : na >= kkm ? "Tuntas" : "Remedial"}
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
