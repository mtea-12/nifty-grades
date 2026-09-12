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

export const Route = createFileRoute("/mapel")({
  head: () => ({
    meta: [
      { title: "Mata Pelajaran — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Daftar mata pelajaran umum, kejuruan, dan muatan lokal beserta KKM." },
      { property: "og:title", content: "Mata Pelajaran — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Kelola mata pelajaran, kelompok, dan kriteria ketuntasan minimal." },
    ],
  }),
  component: DataMapel,
});

type FormMapel = {
  id: string | null;
  kode: string;
  nama: string;
  kelompok: string;
  kkm: string;
  pengampu: string[];
};

const KOSONG: FormMapel = { id: null, kode: "", nama: "", kelompok: "Umum", kkm: "75", pengampu: [] };

function DataMapel() {
  const { guru, mapel, segarkan } = useData();
  const { akun } = useAuth();
  const isAdmin = akun?.peran === "admin";
  const [cari, setCari] = React.useState("");
  const [kel, setKel] = React.useState("semua");
  const [form, setForm] = React.useState<FormMapel | null>(null);
  const [hapusId, setHapusId] = React.useState<string | null>(null);
  const [sibuk, setSibuk] = React.useState(false);

  const hasil = mapel.filter(
    (m) =>
      (kel === "semua" || m.kelompok === kel) &&
      (m.nama.toLowerCase().includes(cari.toLowerCase()) || m.kode.toLowerCase().includes(cari.toLowerCase())),
  );

  function bukaTambah() {
    setForm({ ...KOSONG });
  }

  function bukaEdit(id: string) {
    const m = mapel.find((x) => x.id === id);
    if (!m) return;
    setForm({
      id: m.id,
      kode: m.kode,
      nama: m.nama,
      kelompok: m.kelompok,
      kkm: String(m.kkm),
      pengampu: guru.filter((g) => g.mapelId === m.id).map((g) => g.id),
    });
  }

  async function simpan() {
    if (!form) return;
    const kode = form.kode.trim();
    const nama = form.nama.trim();
    const kkm = Number(form.kkm);
    if (!kode || !nama) {
      toast.error("Kode dan nama mata pelajaran wajib diisi.");
      return;
    }
    if (!Number.isFinite(kkm) || kkm < 0 || kkm > 100) {
      toast.error("KKM harus berupa angka 0–100.");
      return;
    }
    setSibuk(true);
    try {
      let mapelId = form.id;
      if (mapelId) {
        const { error } = await supabase
          .from("mata_pelajaran")
          .update({ kode, nama, kelompok: form.kelompok, kkm })
          .eq("id", mapelId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase
          .from("mata_pelajaran")
          .insert({ kode, nama, kelompok: form.kelompok, kkm })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        mapelId = data.id;
      }

      const sebelum = guru.filter((g) => g.mapelId === mapelId).map((g) => g.id);
      const tambah = form.pengampu.filter((id) => !sebelum.includes(id));
      const lepas = sebelum.filter((id) => !form.pengampu.includes(id));
      if (tambah.length) {
        const { error } = await supabase.from("guru").update({ mapel_id: mapelId }).in("id", tambah);
        if (error) throw new Error(error.message);
      }
      if (lepas.length) {
        const { error } = await supabase.from("guru").update({ mapel_id: null }).in("id", lepas);
        if (error) throw new Error(error.message);
      }

      await segarkan();
      toast.success(form.id ? "Mata pelajaran diperbarui." : "Mata pelajaran ditambahkan.");
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
      const { error } = await supabase.from("mata_pelajaran").delete().eq("id", hapusId);
      if (error) throw new Error(error.message);
      await segarkan();
      toast.success("Mata pelajaran dihapus.");
      setHapusId(null);
    } catch (e) {
      toast.error("Gagal menghapus. Pastikan mata pelajaran tidak dipakai pada nilai atau kelas.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <AppLayout judul="Mata Pelajaran" deskripsi={`${mapel.length} mata pelajaran pada kurikulum berjalan`}>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button onClick={bukaTambah} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Mata Pelajaran
          </Button>
        </div>
      )}
      <PanelTabel
        cari={cari}
        onCari={setCari}
        placeholder="Cari mata pelajaran atau kode…"
        filter={
          <Pilih
            label="Filter kelompok"
            nilai={kel}
            onUbah={setKel}
            opsi={[
              { value: "semua", label: "Semua Kelompok" },
              { value: "Umum", label: "Umum" },
              { value: "Kejuruan", label: "Kejuruan" },
              { value: "Muatan Lokal", label: "Muatan Lokal" },
            ]}
          />
        }
      >
        <table className="w-full min-w-[680px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>Kode</th>
              <th className={thCls}>Nama Mata Pelajaran</th>
              <th className={thCls}>Kelompok</th>
              <th className={thCls}>KKM</th>
              <th className={thCls}>Guru Pengampu</th>
              {isAdmin && <th className={thCls}>Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hasil.length === 0 && <KosongTabel pesan="Mata pelajaran tidak ditemukan." />}
            {hasil.map((m, i) => {
              const pengampu = guru.filter((g) => g.mapelId === m.id);
              return (
                <tr key={m.id} className="hover:bg-secondary/40">
                  <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                  <td className={`${tdCls} font-mono text-xs font-semibold`}>{m.kode}</td>
                  <td className={`${tdCls} whitespace-normal font-medium`}>{m.nama}</td>
                  <td className={tdCls}>
                    <Lencana jenis={m.kelompok === "Kejuruan" ? "sukses" : "netral"} anak={m.kelompok} />
                  </td>
                  <td className={tdCls}>{m.kkm}</td>
                  <td className={`${tdCls} whitespace-normal text-muted-foreground`}>
                    {pengampu.length ? pengampu.map((g) => g.nama).join(", ") : "Belum ditetapkan"}
                  </td>
                  {isAdmin && (
                    <td className={tdCls}>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${m.nama}`}
                          onClick={() => bukaEdit(m.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Hapus ${m.nama}`}
                          onClick={() => setHapusId(m.id)}
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
            <DialogTitle>{form?.id ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
            <DialogDescription>Lengkapi data mata pelajaran dan pilih guru pengampunya.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Kode</span>
                  <input
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    maxLength={20}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">KKM</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.kkm}
                    onChange={(e) => setForm({ ...form, kkm: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </label>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Nama Mata Pelajaran</span>
                <input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  maxLength={80}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <div className="space-y-1 text-sm">
                <span className="font-medium">Kelompok</span>
                <div>
                  <Pilih
                    label="Kelompok"
                    nilai={form.kelompok}
                    onUbah={(v) => setForm({ ...form, kelompok: v })}
                    opsi={[
                      { value: "Umum", label: "Umum" },
                      { value: "Kejuruan", label: "Kejuruan" },
                      { value: "Muatan Lokal", label: "Muatan Lokal" },
                    ]}
                  />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <span className="font-medium">Guru Pengampu</span>
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                  {guru.length === 0 && <p className="p-2 text-muted-foreground">Belum ada data guru.</p>}
                  {guru.map((g) => {
                    const dipilih = form.pengampu.includes(g.id);
                    const lain = g.mapelId && g.mapelId !== form.id;
                    return (
                      <label key={g.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-secondary/50">
                        <input
                          type="checkbox"
                          checked={dipilih}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              pengampu: e.target.checked
                                ? [...form.pengampu, g.id]
                                : form.pengampu.filter((id) => id !== g.id),
                            })
                          }
                        />
                        <span>{g.nama}</span>
                        {lain && !dipilih && (
                          <span className="text-xs text-muted-foreground">(mengampu mapel lain)</span>
                        )}
                      </label>
                    );
                  })}
                </div>
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
            <AlertDialogTitle>Hapus mata pelajaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Mata pelajaran yang sudah memiliki nilai tidak dapat dihapus.
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
