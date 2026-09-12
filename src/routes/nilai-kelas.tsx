import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { School, TrendingUp, AlertTriangle, Award } from "lucide-react";
import { AppLayout, KartuStat } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, Lencana, KosongTabel } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { nilaiAkhir, predikat } from "@/lib/data";
import { useData } from "@/lib/db";

export const Route = createFileRoute("/nilai-kelas")({
  head: () => ({
    meta: [
      { title: "Nilai per Kelas — SMK Muhammadiyah 1 Paguyangan" },
      {
        name: "description",
        content:
          "Performa nilai tiap kelas: daftar siswa, rata-rata per mata pelajaran, dan grafik perbandingan.",
      },
      { property: "og:title", content: "Nilai per Kelas — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Pantau performa akademik tiap kelas dengan grafik." },
    ],
  }),
  component: NilaiPerKelas,
});

function NilaiPerKelas() {
  const { kelas, mapel, mapelKelas, namaGuru, siswa, nilai, kodeMapel, namaMapel, kkmMapel } =
    useData();
  const { akun } = useAuth();
  const [kelasId, setKelasId] = React.useState("");
  const [cari, setCari] = React.useState("");

  React.useEffect(() => {
    if (!kelasId && kelas.length && kelas[0]) setKelasId(kelas[0].id);
  }, [kelas, kelasId]);

  const k = kelas.find((x) => x.id === kelasId);
  const daftarMapel = React.useMemo(
    () => (k ? (mapelKelas[k.id] ?? []).length ? mapelKelas[k.id]! : mapel.map((m) => m.id) : []),
    [k, mapelKelas, mapel],
  );

  const baris = React.useMemo(() => {
    if (!k) return [];
    return siswa
      .filter((s) => s.kelasId === k.id)
      .map((s) => {
        const ns = daftarMapel.map((mid) => {
          const n = nilai.find((x) => x.siswaId === s.id && x.mapelId === mid);
          return { mid, na: n ? nilaiAkhir(n) : 0 };
        });
        const terisi = ns.filter((x) => x.na > 0);
        const rata = terisi.length
          ? Math.round(terisi.reduce((a, b) => a + b.na, 0) / terisi.length)
          : 0;
        const remedial = terisi.filter((x) => x.na < kkmMapel(x.mid)).length;
        return { s, ns, rata, belum: ns.length - terisi.length, remedial };
      })
      .sort((a, b) => b.rata - a.rata);
  }, [k, siswa, nilai, daftarMapel, kkmMapel]);

  const tersaring = baris.filter(
    (b) => b.s.nama.toLowerCase().includes(cari.toLowerCase()) || b.s.nis.includes(cari),
  );

  const rataKelas = baris.length
    ? Math.round(baris.reduce((a, b) => a + b.rata, 0) / baris.length)
    : 0;

  // Grafik: rata-rata kelas per mapel
  const dataMapel = daftarMapel.map((mid) => {
    const terisi = baris.map((b) => b.ns.find((x) => x.mid === mid)!).filter((x) => x.na > 0);
    const rata = terisi.length
      ? Math.round(terisi.reduce((a, b) => a + b.na, 0) / terisi.length)
      : 0;
    return { kode: kodeMapel(mid), nama: namaMapel(mid), rata, kkm: kkmMapel(mid) };
  });

  // Grafik: distribusi predikat siswa
  const distribusi = (["A", "B", "C", "D", "-"] as const).map((h) => ({
    huruf: h,
    jumlah: baris.filter((b) => predikat(b.rata).huruf === h).length,
  }));
  const warnaPredikat: Record<string, string> = {
    A: "var(--primary)",
    B: "var(--success)",
    C: "var(--warning)",
    D: "var(--destructive)",
    "-": "var(--muted-foreground)",
  };

  if (akun?.peran !== "admin") {
    return (
      <AppLayout judul="Nilai per Kelas">
        <p className="text-sm text-muted-foreground">Halaman ini khusus untuk admin.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      judul="Nilai per Kelas"
      deskripsi={k ? `${k.nama} · Wali Kelas: ${namaGuru(k.waliId)}` : "Performa akademik tiap kelas"}
      aksi={
        <Pilih
          label="Pilih kelas"
          nilai={kelasId}
          onUbah={setKelasId}
          opsi={kelas.map((x) => ({ value: x.id, label: x.nama }))}
        />
      }
    >
      {!k ? (
        <p className="text-sm text-muted-foreground">Belum ada data kelas.</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KartuStat label="Jumlah Siswa" nilai={baris.length} ikon={School} catatan={k.nama} />
            <KartuStat
              label="Rata-rata Kelas"
              nilai={rataKelas}
              ikon={TrendingUp}
              catatan="Semua mata pelajaran"
            />
            <KartuStat
              label="Peringkat 1"
              nilai={baris[0]?.rata ?? 0}
              ikon={Award}
              catatan={baris[0]?.s.nama ?? "-"}
            />
            <KartuStat
              label="Perlu Remedial"
              nilai={baris.filter((b) => b.remedial > 0).length}
              ikon={AlertTriangle}
              catatan="Siswa dengan nilai di bawah KKM"
            />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-3">
              <h3 className="mb-3 font-display text-sm font-bold">
                Rata-rata Kelas per Mata Pelajaran
              </h3>
              {dataMapel.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada nilai yang tercatat.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataMapel} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="kode" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v: any, name: any) => [
                          v,
                          name === "rata" ? "Rata-rata" : "KKM",
                        ]}
                        labelFormatter={(_: any, payload: any) =>
                          payload?.[0]?.payload?.nama ?? ""
                        }
                      />
                      <Legend formatter={(v) => (v === "rata" ? "Rata-rata" : "KKM")} />
                      <Bar dataKey="rata" radius={[4, 4, 0, 0]} fill="var(--primary)" />
                      <Bar dataKey="kkm" radius={[4, 4, 0, 0]} fill="var(--warning)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
              <h3 className="mb-3 font-display text-sm font-bold">Distribusi Predikat Siswa</h3>
              {baris.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada siswa di kelas ini.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribusi.filter((d) => d.jumlah > 0)}
                        dataKey="jumlah"
                        nameKey="huruf"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ huruf, jumlah }) => `${huruf} (${jumlah})`}
                      >
                        {distribusi
                          .filter((d) => d.jumlah > 0)
                          .map((d) => (
                            <Cell key={d.huruf} fill={warnaPredikat[d.huruf]} />
                          ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, "Siswa"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <PanelTabel cari={cari} onCari={setCari} placeholder="Cari nama siswa atau NIS…">
            <table className="w-full min-w-[900px]">
              <thead className="bg-secondary/60">
                <tr>
                  <th className={thCls}>Pkt</th>
                  <th className={thCls}>Nama Siswa</th>
                  <th className={thCls}>NIS</th>
                  {daftarMapel.map((mid) => (
                    <th key={mid} className={`${thCls} text-center`}>
                      {kodeMapel(mid)}
                    </th>
                  ))}
                  <th className={thCls}>Rata²</th>
                  <th className={thCls}>Predikat</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tersaring.length === 0 && (
                  <KosongTabel pesan="Tidak ada siswa yang cocok dengan pencarian." />
                )}
                {tersaring.map((b) => (
                  <tr key={b.s.id} className="hover:bg-secondary/40">
                    <td className={`${tdCls} text-muted-foreground`}>{baris.indexOf(b) + 1}</td>
                    <td className={`${tdCls} font-medium`}>{b.s.nama}</td>
                    <td className={`${tdCls} text-muted-foreground`}>{b.s.nis}</td>
                    {b.ns.map((x) => (
                      <td
                        key={x.mid}
                        className={`${tdCls} text-center ${
                          x.na === 0
                            ? "text-muted-foreground"
                            : x.na < kkmMapel(x.mid)
                              ? "font-semibold text-destructive"
                              : ""
                        }`}
                      >
                        {x.na || "-"}
                      </td>
                    ))}
                    <td className={`${tdCls} font-bold`}>{b.rata}</td>
                    <td className={tdCls}>{predikat(b.rata).huruf}</td>
                    <td className={tdCls}>
                      <Lencana
                        jenis={b.belum > 0 ? "peringatan" : b.remedial > 0 ? "bahaya" : "sukses"}
                        anak={
                          b.belum > 0
                            ? `${b.belum} kosong`
                            : b.remedial > 0
                              ? `${b.remedial} remedial`
                              : "Tuntas"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelTabel>
        </>
      )}
    </AppLayout>
  );
}
