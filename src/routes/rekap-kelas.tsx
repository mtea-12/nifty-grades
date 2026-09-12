import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, KartuStat } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, Lencana, KosongTabel } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { useNilai } from "@/lib/nilai-store";
import { nilaiAkhir, predikat } from "@/lib/data";
import { useData } from "@/lib/db";
import { Users, TrendingUp, AlertTriangle, Award } from "lucide-react";

export const Route = createFileRoute("/rekap-kelas")({
  head: () => ({
    meta: [
      { title: "Rekap Kelas — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Rekap nilai seluruh mata pelajaran dan status kelengkapan nilai untuk wali kelas." },
      { property: "og:title", content: "Rekap Kelas — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Pantau nilai rata-rata, peringkat, dan kelengkapan nilai kelas perwalian." },
    ],
  }),
  component: RekapKelas,
});

function RekapKelas() {
  const { kelas, kkmMapel, kodeMapel, mapelKelas, namaGuru, siswa } = useData();
  const { akun } = useAuth();
  const { nilai } = useNilai();
  const k = kelas.find((x) => x.waliId === akun?.refId);
  const [cari, setCari] = React.useState("");
  const [status, setStatus] = React.useState("semua");

  if (!akun || !k) {
    return (
      <AppLayout judul="Rekap Kelas">
        <p className="text-sm text-muted-foreground">Halaman ini khusus untuk wali kelas.</p>
      </AppLayout>
    );
  }

  const daftarMapel = mapelKelas[k.id] ?? [];
  const baris = siswa
    .filter((s) => s.kelasId === k.id)
    .map((s) => {
      const ns = daftarMapel.map((mid) => {
        const n = nilai.find((x) => x.siswaId === s.id && x.mapelId === mid);
        return { mid, na: n ? nilaiAkhir(n) : 0 };
      });
      const terisi = ns.filter((x) => x.na > 0);
      const rata = terisi.length ? Math.round(terisi.reduce((a, b) => a + b.na, 0) / terisi.length) : 0;
      const belum = ns.length - terisi.length;
      const remedial = terisi.filter((x) => x.na < kkmMapel(x.mid)).length;
      return { s, ns, rata, belum, remedial };
    })
    .sort((a, b) => b.rata - a.rata);

  const tersaring = baris
    .filter((b) => b.s.nama.toLowerCase().includes(cari.toLowerCase()) || b.s.nis.includes(cari))
    .filter((b) =>
      status === "semua" ? true : status === "belum" ? b.belum > 0 : status === "remedial" ? b.remedial > 0 : b.belum === 0 && b.remedial === 0,
    );

  const rataKelas = baris.length ? Math.round(baris.reduce((a, b) => a + b.rata, 0) / baris.length) : 0;

  return (
    <AppLayout judul={`Rekap Kelas ${k.nama}`} deskripsi={`${k.jurusan} · Wali Kelas: ${namaGuru(k.waliId)}`}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStat label="Jumlah Siswa" nilai={baris.length} ikon={Users} catatan={k.nama} />
        <KartuStat label="Rata-rata Kelas" nilai={rataKelas} ikon={TrendingUp} catatan="Semua mata pelajaran" />
        <KartuStat label="Peringkat 1" nilai={baris[0]?.rata ?? 0} ikon={Award} catatan={baris[0]?.s.nama ?? "-"} />
        <KartuStat
          label="Nilai Belum Lengkap"
          nilai={baris.reduce((a, b) => a + b.belum, 0)}
          ikon={AlertTriangle}
          catatan="Total sel nilai kosong"
        />
      </div>

      <PanelTabel
        cari={cari}
        onCari={setCari}
        placeholder="Cari nama siswa atau NIS…"
        filter={
          <Pilih
            label="Filter status"
            nilai={status}
            onUbah={setStatus}
            opsi={[
              { value: "semua", label: "Semua Status" },
              { value: "lengkap", label: "Lengkap & Tuntas" },
              { value: "remedial", label: "Ada Remedial" },
              { value: "belum", label: "Nilai Belum Lengkap" },
            ]}
          />
        }
      >
        <table className="w-full min-w-[900px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>Pkt</th>
              <th className={thCls}>Nama Siswa</th>
              {daftarMapel.map((mid) => (
                <th key={mid} className={`${thCls} text-center`}>
                  {kodeMapel(mid)}
                </th>
              ))}
              <th className={thCls}>Rata²</th>
              <th className={thCls}>Predikat</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Rapor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tersaring.length === 0 && <KosongTabel pesan="Tidak ada siswa yang cocok dengan filter." />}
            {tersaring.map((b) => (
              <tr key={b.s.id} className="hover:bg-secondary/40">
                <td className={`${tdCls} text-muted-foreground`}>{baris.indexOf(b) + 1}</td>
                <td className={`${tdCls} font-medium`}>{b.s.nama}</td>
                {b.ns.map((x) => (
                  <td
                    key={x.mid}
                    className={`${tdCls} text-center ${x.na === 0 ? "text-muted-foreground" : x.na < kkmMapel(x.mid) ? "font-semibold text-destructive" : ""}`}
                  >
                    {x.na || "-"}
                  </td>
                ))}
                <td className={`${tdCls} font-bold`}>{b.rata}</td>
                <td className={tdCls}>{predikat(b.rata).huruf}</td>
                <td className={tdCls}>
                  <Lencana
                    jenis={b.belum > 0 ? "peringatan" : b.remedial > 0 ? "bahaya" : "sukses"}
                    anak={b.belum > 0 ? `${b.belum} kosong` : b.remedial > 0 ? `${b.remedial} remedial` : "Lengkap"}
                  />
                </td>
                <td className={tdCls}>
                  <Link
                    to="/rapor"
                    search={{ siswa: b.s.id }}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-dark"
                  >
                    Lihat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelTabel>
    </AppLayout>
  );
}
