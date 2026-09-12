import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, KosongTabel, Lencana } from "@/components/Tabel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/log-aksi")({
  head: () => ({
    meta: [
      { title: "Log Aksi — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Riwayat perubahan mata pelajaran, data guru, dan nilai beserta pelaku dan waktunya." },
      { property: "og:title", content: "Log Aksi — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Catatan siapa mengubah apa dan kapan pada sistem penilaian." },
    ],
  }),
  component: LogAksi,
});

const LABEL_TABEL: Record<string, string> = {
  mata_pelajaran: "Mata Pelajaran",
  guru: "Data Guru",
  nilai: "Nilai",
};

function LogAksi() {
  const { akun } = useAuth();
  const [cari, setCari] = React.useState("");
  const [tabel, setTabel] = React.useState("semua");

  const { data, isLoading, error } = useQuery({
    queryKey: ["log-aksi"],
    enabled: akun?.peran === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("log_aksi")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  if (akun && akun.peran !== "admin") {
    return (
      <AppLayout judul="Log Aksi">
        <p className="text-sm text-muted-foreground">Halaman ini khusus untuk administrator.</p>
      </AppLayout>
    );
  }

  const hasil = (data ?? []).filter(
    (l) =>
      (tabel === "semua" || l.tabel === tabel) &&
      (l.ringkasan.toLowerCase().includes(cari.toLowerCase()) ||
        l.pelaku_nama.toLowerCase().includes(cari.toLowerCase())),
  );

  return (
    <AppLayout judul="Log Aksi" deskripsi="Riwayat perubahan mata pelajaran, guru, dan nilai">
      <PanelTabel
        cari={cari}
        onCari={setCari}
        placeholder="Cari keterangan atau nama pelaku…"
        filter={
          <Pilih
            label="Filter data"
            nilai={tabel}
            onUbah={setTabel}
            opsi={[
              { value: "semua", label: "Semua Data" },
              { value: "mata_pelajaran", label: "Mata Pelajaran" },
              { value: "guru", label: "Data Guru" },
              { value: "nilai", label: "Nilai" },
            ]}
          />
        }
      >
        <table className="w-full min-w-[760px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>Waktu</th>
              <th className={thCls}>Data</th>
              <th className={thCls}>Aksi</th>
              <th className={thCls}>Keterangan</th>
              <th className={thCls}>Oleh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <KosongTabel pesan="Memuat catatan…" />}
            {error && <KosongTabel pesan="Gagal memuat catatan perubahan." />}
            {!isLoading && !error && hasil.length === 0 && <KosongTabel pesan="Belum ada catatan perubahan." />}
            {hasil.map((l) => (
              <tr key={l.id} className="hover:bg-secondary/40">
                <td className={`${tdCls} text-muted-foreground`}>
                  {new Date(l.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className={tdCls}>{LABEL_TABEL[l.tabel] ?? l.tabel}</td>
                <td className={tdCls}>
                  <Lencana
                    jenis={l.aksi === "tambah" ? "sukses" : l.aksi === "hapus" ? "bahaya" : "peringatan"}
                    anak={l.aksi}
                  />
                </td>
                <td className={`${tdCls} whitespace-normal`}>{l.ringkasan || "-"}</td>
                <td className={`${tdCls} font-medium`}>{l.pelaku_nama || "Sistem"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelTabel>
    </AppLayout>
  );
}
