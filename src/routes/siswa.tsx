import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, KosongTabel, Lencana } from "@/components/Tabel";
import { useData } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { nilaiAkhir } from "@/lib/data";

export const Route = createFileRoute("/siswa")({
  head: () => ({
    meta: [
      { title: "Data Siswa — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Daftar lengkap data siswa per kelas dengan pencarian dan filter." },
      { property: "og:title", content: "Data Siswa — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Kelola data induk siswa: NIS, NISN, kelas, dan wali." },
    ],
  }),
  component: DataSiswa,
});

function DataSiswa() {
  const { kelas, namaKelas, siswa, nilai } = useData();
  const { akun } = useAuth();
  const isAdmin = akun?.peran === "admin";
  const [cari, setCari] = React.useState("");
  const [kls, setKls] = React.useState("semua");
  const [jk, setJk] = React.useState("semua");

  const hasil = siswa.filter(
    (s) =>
      (kls === "semua" || s.kelasId === kls) &&
      (jk === "semua" || s.jk === jk) &&
      (s.nama.toLowerCase().includes(cari.toLowerCase()) || s.nis.includes(cari) || s.nisn.includes(cari)),
  );

  return (
    <AppLayout judul="Data Siswa" deskripsi={`${hasil.length} siswa ditampilkan dari ${siswa.length} total`}>
      <PanelTabel
        cari={cari}
        onCari={setCari}
        placeholder="Cari nama, NIS, atau NISN…"
        filter={
          <>
            <Pilih
              label="Filter kelas"
              nilai={kls}
              onUbah={setKls}
              opsi={[{ value: "semua", label: "Semua Kelas" }, ...kelas.map((k) => ({ value: k.id, label: k.nama }))]}
            />
            <Pilih
              label="Filter jenis kelamin"
              nilai={jk}
              onUbah={setJk}
              opsi={[
                { value: "semua", label: "Semua Jenis Kelamin" },
                { value: "L", label: "Laki-laki" },
                { value: "P", label: "Perempuan" },
              ]}
            />
          </>
        }
      >
        <table className="w-full min-w-[720px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>NIS</th>
              <th className={thCls}>NISN</th>
              <th className={thCls}>Nama Siswa</th>
              <th className={thCls}>L/P</th>
              <th className={thCls}>Kelas</th>
              <th className={thCls}>Orang Tua/Wali</th>
              <th className={thCls}>Rata-rata Nilai</th>
              {isAdmin && <th className={thCls}>Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hasil.length === 0 && <KosongTabel pesan="Data siswa tidak ditemukan." />}
            {hasil.map((s, i) => {
              const nilaiSiswa = nilai.filter((n) => n.siswaId === s.id);
              const terisi = nilaiSiswa.map((n) => nilaiAkhir(n)).filter((v) => v > 0);
              const rata = terisi.length
                ? Math.round(terisi.reduce((a, b) => a + b, 0) / terisi.length)
                : 0;
              return (
                <tr key={s.id} className="hover:bg-secondary/40">
                  <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                  <td className={`${tdCls} font-mono text-xs`}>{s.nis}</td>
                  <td className={`${tdCls} font-mono text-xs`}>{s.nisn}</td>
                  <td className={`${tdCls} font-medium`}>{s.nama}</td>
                  <td className={tdCls}>{s.jk}</td>
                  <td className={tdCls}>
                    <Lencana anak={namaKelas(s.kelasId)} />
                  </td>
                  <td className={`${tdCls} text-muted-foreground`}>{s.wali}</td>
                  <td className={tdCls}>
                    {terisi.length ? (
                      <span className="font-display font-bold">
                        {rata}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ({terisi.length} mapel)
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Belum ada nilai</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className={tdCls}>
                      <Link
                        to="/nilai-siswa"
                        search={{ siswa: s.id }}
                        className="font-semibold text-primary hover:underline"
                      >
                        Isi nilai
                      </Link>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </PanelTabel>
    </AppLayout>
  );
}
