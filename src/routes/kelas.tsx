import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, thCls, tdCls, KosongTabel, Lencana } from "@/components/Tabel";
import { useData } from "@/lib/db";

export const Route = createFileRoute("/kelas")({
  head: () => ({
    meta: [
      { title: "Data Kelas — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Daftar rombongan belajar, jurusan, wali kelas, dan jumlah siswa." },
      { property: "og:title", content: "Data Kelas — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Kelola rombongan belajar dan penugasan wali kelas." },
    ],
  }),
  component: DataKelas,
});

function DataKelas() {
  const { kelas, mapelKelas, namaGuru, siswa } = useData();
  const [cari, setCari] = React.useState("");
  const hasil = kelas.filter(
    (k) => k.nama.toLowerCase().includes(cari.toLowerCase()) || k.jurusan.toLowerCase().includes(cari.toLowerCase()),
  );

  return (
    <AppLayout judul="Data Kelas" deskripsi={`${kelas.length} rombongan belajar aktif`}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kelas.map((k) => {
          const jml = siswa.filter((s) => s.kelasId === k.id);
          return (
            <div key={k.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold">{k.nama}</h3>
                  <p className="truncate text-xs text-muted-foreground">{k.jurusan}</p>
                </div>
                <Lencana anak={`${jml.length} siswa`} />
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Wali Kelas</dt>
                  <dd className="min-w-0 truncate font-medium">{namaGuru(k.waliId)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Mata Pelajaran</dt>
                  <dd className="font-medium">{(mapelKelas[k.id] ?? []).length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">L / P</dt>
                  <dd className="font-medium">
                    {jml.filter((s) => s.jk === "L").length} / {jml.filter((s) => s.jk === "P").length}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <PanelTabel cari={cari} onCari={setCari} placeholder="Cari kelas atau jurusan…">
        <table className="w-full min-w-[680px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>Kelas</th>
              <th className={thCls}>Tingkat</th>
              <th className={thCls}>Program Keahlian</th>
              <th className={thCls}>Wali Kelas</th>
              <th className={thCls}>Jumlah Siswa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hasil.length === 0 && <KosongTabel pesan="Data kelas tidak ditemukan." />}
            {hasil.map((k, i) => (
              <tr key={k.id} className="hover:bg-secondary/40">
                <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                <td className={`${tdCls} font-medium`}>{k.nama}</td>
                <td className={tdCls}>{k.tingkat}</td>
                <td className={`${tdCls} whitespace-normal`}>{k.jurusan}</td>
                <td className={tdCls}>{namaGuru(k.waliId)}</td>
                <td className={tdCls}>{siswa.filter((s) => s.kelasId === k.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelTabel>
    </AppLayout>
  );
}
