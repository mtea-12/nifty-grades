import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, KosongTabel, Lencana } from "@/components/Tabel";
import { useData } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { nilaiAkhir } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

type FormSiswa = {
  id: string | null;
  nis: string;
  nisn: string;
  nama: string;
  jk: string;
  kelasId: string;
  wali: string;
  tanggalLahir: string;
};

const KOSONG: FormSiswa = { id: null, nis: "", nisn: "", nama: "", jk: "L", kelasId: "", wali: "", tanggalLahir: "" };

const skemaSiswa = z.object({
  nis: z
    .string()
    .trim()
    .min(1, "NIS wajib diisi.")
    .regex(/^\d{4,20}$/, "NIS harus berupa 4–20 digit angka."),
  nisn: z
    .string()
    .trim()
    .min(1, "NISN wajib diisi.")
    .regex(/^\d{10}$/, "NISN harus tepat 10 digit angka."),
  nama: z
    .string()
    .trim()
    .min(1, "Nama siswa wajib diisi.")
    .min(3, "Nama minimal 3 karakter.")
    .max(80, "Nama maksimal 80 karakter.")
    .regex(/^[A-Za-zÀ-ÿ'.,\- ]+$/, "Nama hanya boleh berisi huruf, spasi, titik, koma, apostrof, atau tanda hubung."),
  kelasId: z.string().min(1, "Kelas wajib dipilih."),
  tanggalLahir: z
    .string()
    .min(1, "Tanggal lahir wajib diisi.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal lahir tidak valid.")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      const kini = new Date();
      const batasBawah = new Date(kini.getFullYear() - 25, kini.getMonth(), kini.getDate());
      const batasAtas = new Date(kini.getFullYear() - 10, kini.getMonth(), kini.getDate());
      return d >= batasBawah && d <= batasAtas;
    }, "Tanggal lahir tidak masuk akal untuk usia siswa (10–25 tahun)."),
});

type GalatForm = Partial<Record<"nis" | "nisn" | "nama" | "kelasId" | "tanggalLahir", string>>;

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

function DataSiswa() {
  const { kelas, namaKelas, siswa, nilai, segarkan } = useData();
  const { akun } = useAuth();
  const isAdmin = akun?.peran === "admin";
  const [cari, setCari] = React.useState("");
  const [kls, setKls] = React.useState("semua");
  const [jk, setJk] = React.useState("semua");
  const [form, setForm] = React.useState<FormSiswa | null>(null);
  const [hapusId, setHapusId] = React.useState<string | null>(null);
  const [sibuk, setSibuk] = React.useState(false);
  const [galat, setGalat] = React.useState<GalatForm>({});

  const hasil = siswa.filter(
    (s) =>
      (kls === "semua" || s.kelasId === kls) &&
      (jk === "semua" || s.jk === jk) &&
      (s.nama.toLowerCase().includes(cari.toLowerCase()) || s.nis.includes(cari) || s.nisn.includes(cari)),
  );

  function bukaTambah() {
    setForm({ ...KOSONG, kelasId: kls !== "semua" ? kls : (kelas[0]?.id ?? "") });
    setGalat({});
  }

  function bukaEdit(id: string) {
    const s = siswa.find((x) => x.id === id);
    if (!s) return;
    setForm({
      id: s.id,
      nis: s.nis,
      nisn: s.nisn,
      nama: s.nama,
      jk: s.jk,
      kelasId: s.kelasId ?? "",
      wali: s.wali,
      tanggalLahir: s.tanggalLahir ?? "",
    });
    setGalat({});
  }

  async function simpan() {
    if (!form) return;
    const hasilValidasi = skemaSiswa.safeParse(form);
    if (!hasilValidasi.success) {
      const g: GalatForm = {};
      for (const isu of hasilValidasi.error.issues) {
        const kunci = isu.path[0] as keyof GalatForm;
        if (!g[kunci]) g[kunci] = isu.message;
      }
      setGalat(g);
      toast.error("Periksa kembali isian form — ada data yang belum valid.");
      return;
    }
    setGalat({});
    const v = hasilValidasi.data;
    const duplikatNisn = siswa.some((s) => s.nisn === v.nisn && s.id !== form.id);
    if (duplikatNisn) {
      setGalat({ nisn: "NISN sudah digunakan siswa lain." });
      toast.error("NISN sudah terdaftar atas nama siswa lain.");
      return;
    }
    const baris = {
      nis: v.nis,
      nisn: v.nisn,
      nama: v.nama,
      jk: form.jk,
      kelas_id: v.kelasId,
      wali: form.wali.trim(),
      tanggal_lahir: v.tanggalLahir,
    };
    setSibuk(true);
    try {
      if (form.id) {
        const { error } = await supabase.from("siswa").update(baris).eq("id", form.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("siswa").insert(baris);
        if (error) throw new Error(error.message);
      }
      await segarkan();
      toast.success(form.id ? "Data siswa diperbarui." : "Siswa ditambahkan.");
      setForm(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSibuk(false);
    }
  }

  async function hapus() {
    if (!hapusId) return;
    setSibuk(true);
    try {
      const { error } = await supabase.from("siswa").delete().eq("id", hapusId);
      if (error) throw new Error(error.message);
      await segarkan();
      toast.success("Siswa dihapus.");
      setHapusId(null);
    } catch {
      toast.error("Gagal menghapus. Pastikan siswa belum memiliki data nilai.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <AppLayout judul="Data Siswa" deskripsi={`${hasil.length} siswa ditampilkan dari ${siswa.length} total`}>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button onClick={bukaTambah} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Siswa
          </Button>
        </div>
      )}
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
                      <div className="flex items-center gap-1">
                        <Link
                          to="/nilai-siswa"
                          search={{ siswa: s.id }}
                          className="mr-1 font-semibold text-primary hover:underline"
                        >
                          Isi nilai
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${s.nama}`}
                          onClick={() => bukaEdit(s.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Hapus ${s.nama}`}
                          onClick={() => setHapusId(s.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </PanelTabel>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle>
            <DialogDescription>Lengkapi data induk siswa lalu simpan.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">NIS <span className="text-destructive">*</span></span>
                  <input
                    value={form.nis}
                    onChange={(e) => setForm({ ...form, nis: e.target.value })}
                    maxLength={20}
                    inputMode="numeric"
                    placeholder="cth: 2401"
                    className={inputCls}
                  />
                  {galat.nis && <span className="block text-xs text-destructive">{galat.nis}</span>}
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">NISN <span className="text-destructive">*</span></span>
                  <input
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="10 digit angka"
                    className={inputCls}
                  />
                  {galat.nisn && <span className="block text-xs text-destructive">{galat.nisn}</span>}
                </label>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Nama Siswa <span className="text-destructive">*</span></span>
                <input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  maxLength={80}
                  placeholder="Nama lengkap siswa"
                  className={inputCls}
                />
                {galat.nama && <span className="block text-xs text-destructive">{galat.nama}</span>}
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Tanggal Lahir <span className="text-destructive">*</span></span>
                <input
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })}
                  max={new Date().toISOString().slice(0, 10)}
                  className={inputCls}
                />
                {galat.tanggalLahir && <span className="block text-xs text-destructive">{galat.tanggalLahir}</span>}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <span className="font-medium">Jenis Kelamin</span>
                  <div>
                    <Pilih
                      label="Jenis kelamin"
                      nilai={form.jk}
                      onUbah={(v) => setForm({ ...form, jk: v })}
                      opsi={[
                        { value: "L", label: "Laki-laki" },
                        { value: "P", label: "Perempuan" },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <span className="font-medium">Kelas <span className="text-destructive">*</span></span>
                  <div>
                    <Pilih
                      label="Kelas"
                      nilai={form.kelasId}
                      onUbah={(v) => setForm({ ...form, kelasId: v })}
                      opsi={kelas.map((k) => ({ value: k.id, label: k.nama }))}
                    />
                  </div>
                  {galat.kelasId && <span className="block text-xs text-destructive">{galat.kelasId}</span>}
                </div>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Orang Tua/Wali</span>
                <input
                  value={form.wali}
                  onChange={(e) => setForm({ ...form, wali: e.target.value })}
                  maxLength={80}
                  className={inputCls}
                />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)} disabled={sibuk}>
              Batal
            </Button>
            <Button onClick={simpan} disabled={sibuk}>
              {sibuk ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!hapusId} onOpenChange={(o) => !o && setHapusId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus siswa ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Siswa yang sudah memiliki nilai tidak dapat dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sibuk}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void hapus(); }} disabled={sibuk}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
