import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, KartuStat } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, Lencana, KosongTabel } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { useNilai } from "@/lib/nilai-store";
import { nilaiAkhir, predikat } from "@/lib/data";
import { useData } from "@/lib/db";
import { TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/rekap-nilai")({
  head: () => ({
    meta: [
      { title: "Rekap Nilai — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Rekapitulasi nilai tugas, PTS, PAS, dan nilai akhir per kelas untuk guru mata pelajaran." },
      { property: "og:title", content: "Rekap Nilai — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Lihat rekap nilai dan ketuntasan siswa per kelas." },
    ],
  }),
  component: RekapNilai,
});

function RekapNilai() {
  const { guru, kelas, kkmMapel, mapelKelas, namaMapel, siswa } = useData();
  const { akun } = useAuth();
  const { nilai } = useNilai();
  const g = guru.find((x) => x.id === akun?.refId);
  const kelasDiampu = kelas.filter((k) => (mapelKelas[k.id] ?? []).includes(g?.mapelId ?? ""));
  const [kls, setKls] = React.useState("semua");
  const [cari, setCari] = React.useState("");
  const [status, setStatus] = React.useState("semua");

  if (!akun || !g) {
    return (
      <AppLayout judul="Rekap Nilai">
        <p className="text-sm text-muted-foreground">Halaman ini khusus untuk guru mata pelajaran.</p>
      </AppLayout>
    );
  }

  const mapelId = g.mapelId;
  const kkm = kkmMapel(mapelId);

  const baris = siswa
    .filter((s) => kelasDiampu.some((k) => k.id === s.kelasId))
    .filter((s) => kls === "semua" || s.kelasId === kls)
    .map((s) => {
      const n = nilai.find((x) => x.siswaId === s.id && x.mapelId === mapelId);
      const na = n ? nilaiAkhir(n) : 0;
      return { s, n, na };
    })
    .filter((b) => b.s.nama.toLowerCase().includes(cari.toLowerCase()) || b.s.nis.includes(cari))
    .filter((b) =>
      status === "semua"
        ? true
        : status === "tuntas"
          ? b.na >= kkm && b.na > 0
          : status === "remedial"
            ? b.na > 0 && b.na < kkm
            : b.na === 0,
    );

  const terisi = baris.filter((b) => b.na > 0);
  const rata = terisi.length ? Math.round(terisi.reduce((a, b) => a + b.na, 0) / terisi.length) : 0;

  return (
    <AppLayout judul="Rekap Nilai" deskripsi={`${namaMapel(mapelId)} · KKM ${kkm}`}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Siswa Ditampilkan" nilai={baris.length} ikon={Users} />
        <KartuStat label="Rata-rata" nilai={rata} ikon={TrendingUp} catatan="Nilai akhir" />
        <KartuStat label="Tuntas" nilai={terisi.filter((b) => b.na >= kkm).length} ikon={CheckCircle2} catatan={`≥ KKM ${kkm}`} />
        <KartuStat label="Belum Tuntas" nilai={terisi.filter((b) => b.na < kkm).length} ikon={XCircle} catatan="Perlu remedial" />
      </div>

      <PanelTabel
        cari={cari}
        onCari={setCari}
        placeholder="Cari nama siswa atau NIS…"
        filter={
          <>
            <Pilih
              label="Filter kelas"
              nilai={kls}
              onUbah={setKls}
              opsi={[{ value: "semua", label: "Semua Kelas" }, ...kelasDiampu.map((k) => ({ value: k.id, label: k.nama }))]}
            />
            <Pilih
              label="Filter status"
              nilai={status}
              onUbah={setStatus}
              opsi={[
                { value: "semua", label: "Semua Status" },
                { value: "tuntas", label: "Tuntas" },
                { value: "remedial", label: "Remedial" },
                { value: "kosong", label: "Belum Lengkap" },
              ]}
            />
          </>
        }
      >
        <table className="w-full min-w-[820px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>NIS</th>
              <th className={thCls}>Nama Siswa</th>
              <th className={thCls}>Kelas</th>
              <th className={thCls}>Tugas</th>
              <th className={thCls}>PTS</th>
              <th className={thCls}>PAS</th>
              <th className={thCls}>NA</th>
              <th className={thCls}>Predikat</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {baris.length === 0 && <KosongTabel pesan="Tidak ada data nilai yang cocok." />}
            {baris.map((b, i) => (
              <tr key={b.s.id} className="hover:bg-secondary/40">
                <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                <td className={`${tdCls} font-mono text-xs`}>{b.s.nis}</td>
                <td className={`${tdCls} font-medium`}>{b.s.nama}</td>
                <td className={tdCls}>{kelas.find((k) => k.id === b.s.kelasId)?.nama}</td>
                <td className={tdCls}>{b.n?.tugas || "-"}</td>
                <td className={tdCls}>{b.n?.pts || "-"}</td>
                <td className={tdCls}>{b.n?.pas || "-"}</td>
                <td className={`${tdCls} font-bold`}>{b.na || "-"}</td>
                <td className={tdCls}>{predikat(b.na).huruf}</td>
                <td className={tdCls}>
                  <Lencana
                    jenis={b.na === 0 ? "netral" : b.na >= kkm ? "sukses" : "bahaya"}
                    anak={b.na === 0 ? "Belum lengkap" : b.na >= kkm ? "Tuntas" : "Remedial"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelTabel>
    </AppLayout>
  );
}
