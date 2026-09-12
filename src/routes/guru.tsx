import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, Pilih, thCls, tdCls, KosongTabel, Lencana } from "@/components/Tabel";
import { useData } from "@/lib/db";
import { useAuth } from "@/lib/auth";
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

export const Route = createFileRoute("/guru")({
  head: () => ({
    meta: [
      { title: "Data Guru — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Daftar guru mata pelajaran beserta NIP, mapel yang diampu, dan perwalian kelas." },
      { property: "og:title", content: "Data Guru — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Kelola data guru dan penugasan mata pelajaran." },
    ],
  }),
  component: DataGuru,
});

type FormGuru = {
  id: string | null;
  nip: string;
  nama: string;
  jk: string;
  mapelId: string;
  telepon: string;
};

const KOSONG: FormGuru = { id: null, nip: "", nama: "", jk: "L", mapelId: "", telepon: "" };

function DataGuru() {
  const { guru, kelas, mapel, namaMapel, segarkan } = useData();
  const { akun } = useAuth();
  const isAdmin = akun?.peran === "admin";
  const [cari, setCari] = React.useState("");
  const [form, setForm] = React.useState<FormGuru | null>(null);
  const [hapusId, setHapusId] = React.useState<string | null>(null);
  const [sibuk, setSibuk] = React.useState(false);

  const hasil = guru.filter(
    (g) => g.nama.toLowerCase().includes(cari.toLowerCase()) || g.nip.includes(cari),
  );

  function bukaTambah() {
    setForm({ ...KOSONG });
  }

  function bukaEdit(id: string) {
    const g = guru.find((x) => x.id === id);
    if (!g) return;
    setForm({
      id: g.id,
      nip: g.nip,
      nama: g.nama,
      jk: g.jk,
      mapelId: g.mapelId ?? "",
      telepon: g.telepon,
    });
  }

  async function simpan() {
    if (!form) return;
    const nip = form.nip.trim();
    const nama = form.nama.trim();
    if (!nip || !nama) {
      toast.error("NIP dan nama guru wajib diisi.");
      return;
    }
    const duplikat = guru.some((g) => g.nip === nip && g.id !== form.id);
    if (duplikat) {
      toast.error("NIP sudah digunakan guru lain.");
      return;
    }
    setSibuk(true);
    try {
      const muatan = {
        nip,
        nama,
        jk: form.jk,
        mapel_id: form.mapelId || null,
        telepon: form.telepon.trim(),
      };
      if (form.id) {
        const { error } = await supabase.from("guru").update(muatan).eq("id", form.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("guru").insert(muatan);
        if (error) throw new Error(error.message);
      }
      await segarkan();
      toast.success(form.id ? "Data guru diperbarui." : "Guru baru ditambahkan.");
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
      const { error } = await supabase.from("guru").delete().eq("id", hapusId);
      if (error) throw new Error(error.message);
      await segarkan();
      toast.success("Data guru dihapus.");
      setHapusId(null);
    } catch {
      toast.error("Gagal menghapus. Guru ini masih menjadi wali kelas atau terkait data lain.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <AppLayout judul="Data Guru" deskripsi={`${guru.length} guru terdaftar`}>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button onClick={bukaTambah} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Guru
          </Button>
        </div>
      )}
      <PanelTabel cari={cari} onCari={setCari} placeholder="Cari nama guru atau NIP…">
        <table className="w-full min-w-[760px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>NIP</th>
              <th className={thCls}>Nama Guru</th>
              <th className={thCls}>L/P</th>
              <th className={thCls}>Mata Pelajaran</th>
              <th className={thCls}>Wali Kelas</th>
              <th className={thCls}>Telepon</th>
              {isAdmin && <th className={thCls}>Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hasil.length === 0 && <KosongTabel pesan="Data guru tidak ditemukan." />}
            {hasil.map((g, i) => {
              const wali = kelas.find((k) => k.waliId === g.id);
              return (
                <tr key={g.id} className="hover:bg-secondary/40">
                  <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                  <td className={`${tdCls} font-mono text-xs`}>{g.nip}</td>
                  <td className={`${tdCls} font-medium`}>{g.nama}</td>
                  <td className={tdCls}>{g.jk}</td>
                  <td className={`${tdCls} whitespace-normal`}>{namaMapel(g.mapelId)}</td>
                  <td className={tdCls}>
                    {wali ? <Lencana jenis="sukses" anak={wali.nama} /> : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className={`${tdCls} text-muted-foreground`}>{g.telepon}</td>
                  {isAdmin && (
                    <td className={tdCls}>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${g.nama}`}
                          onClick={() => bukaEdit(g.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Hapus ${g.nama}`}
                          onClick={() => setHapusId(g.id)}
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
            <DialogTitle>{form?.id ? "Edit Guru" : "Tambah Guru"}</DialogTitle>
            <DialogDescription>Lengkapi data guru dan mata pelajaran yang diampu.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">NIP</span>
                  <input
                    value={form.nip}
                    onChange={(e) => setForm({ ...form, nip: e.target.value })}
                    maxLength={25}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <label className="space-y-1 text-sm">
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
                </label>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Nama Guru</span>
                <input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  maxLength={80}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <span className="font-medium">Mata Pelajaran</span>
                  <div>
                    <Pilih
                      label="Mata pelajaran"
                      nilai={form.mapelId}
                      onUbah={(v) => setForm({ ...form, mapelId: v })}
                      opsi={[
                        { value: "", label: "Belum ditetapkan" },
                        ...mapel.map((m) => ({ value: m.id, label: `${m.kode} — ${m.nama}` })),
                      ]}
                    />
                  </div>
                </div>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Telepon</span>
                  <input
                    value={form.telepon}
                    onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                    maxLength={20}
                    placeholder="08xxxxxxxxxx"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </label>
              </div>
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
            <AlertDialogTitle>Hapus guru ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Guru yang masih menjadi wali kelas tidak dapat dihapus.
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
