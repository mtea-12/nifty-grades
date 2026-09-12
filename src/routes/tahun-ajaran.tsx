import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, thCls, tdCls, Lencana } from "@/components/Tabel";
import { useData } from "@/lib/db";

export const Route = createFileRoute("/tahun-ajaran")({
  head: () => ({
    meta: [
      { title: "Tahun Ajaran — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Pengaturan tahun ajaran dan semester aktif untuk proses penilaian." },
      { property: "og:title", content: "Tahun Ajaran — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Atur tahun pelajaran dan semester aktif sekolah." },
    ],
  }),
  component: TahunAjaranPage,
});

function TahunAjaranPage() {
  const { sekolah, tahunAjaran } = useData();
  const aktif = tahunAjaran.find((t) => t.aktif)!;
  return (
    <AppLayout judul="Tahun Ajaran" deskripsi="Periode akademik dan semester aktif">
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Periode Aktif</p>
              <p className="font-display text-2xl font-bold">
                {aktif.tahun} — Semester {aktif.semester}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Seluruh input nilai dan rapor mengacu pada periode ini.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Identitas Sekolah</p>
          <p className="mt-2 font-display text-base font-bold">{sekolah.nama}</p>
          <p className="mt-1 text-sm text-muted-foreground">NPSN {sekolah.npsn}</p>
          <p className="mt-1 text-sm text-muted-foreground">{sekolah.alamat}</p>
        </div>
      </div>

      <PanelTabel>
        <table className="w-full min-w-[560px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>Tahun Pelajaran</th>
              <th className={thCls}>Semester</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tahunAjaran.map((t, i) => (
              <tr key={t.id} className="hover:bg-secondary/40">
                <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                <td className={`${tdCls} font-medium`}>{t.tahun}</td>
                <td className={tdCls}>{t.semester}</td>
                <td className={tdCls}>
                  <Lencana jenis={t.aktif ? "sukses" : "netral"} anak={t.aktif ? "Aktif" : "Arsip"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelTabel>
    </AppLayout>
  );
}
