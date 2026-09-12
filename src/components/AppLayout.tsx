import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarRange,
  PencilLine,
  ClipboardList,
  FileBarChart,
  FileText,
  History,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth, labelPeran } from "@/lib/auth";
import { type Peran } from "@/lib/data";
import { useData } from "@/lib/db";
import { cn } from "@/lib/utils";

type MenuItem = { to: string; label: string; icon: React.ElementType };

const MENU: Record<Peran, MenuItem[]> = {
  admin: [
    { to: "/dasbor", label: "Dasbor", icon: LayoutDashboard },
    { to: "/siswa", label: "Data Siswa", icon: Users },
    { to: "/guru", label: "Data Guru", icon: GraduationCap },
    { to: "/kelas", label: "Data Kelas", icon: School },
    { to: "/mapel", label: "Mata Pelajaran", icon: BookOpen },
    { to: "/nilai-siswa", label: "Nilai per Siswa", icon: PencilLine },
    { to: "/nilai-kelas", label: "Nilai per Kelas", icon: FileBarChart },
    { to: "/tahun-ajaran", label: "Tahun Ajaran", icon: CalendarRange },
    { to: "/log-aksi", label: "Log Aksi", icon: History },
  ],
  guru: [
    { to: "/dasbor", label: "Dasbor", icon: LayoutDashboard },
    { to: "/input-nilai", label: "Input Nilai", icon: PencilLine },
    { to: "/rekap-nilai", label: "Rekap Nilai", icon: ClipboardList },
  ],
  wali: [
    { to: "/dasbor", label: "Dasbor", icon: LayoutDashboard },
    { to: "/rekap-kelas", label: "Rekap Kelas", icon: FileBarChart },
    { to: "/rapor", label: "Rapor Siswa", icon: FileText },
  ],
  siswa: [
    { to: "/dasbor", label: "Dasbor", icon: LayoutDashboard },
    { to: "/nilai-saya", label: "Nilai Saya", icon: ClipboardList },
    { to: "/rapor", label: "Rapor Saya", icon: FileText },
  ],
};

export function Logo({ ringkas = false }: { ringkas?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm">
        <span className="font-display text-lg font-bold">M</span>
      </div>
      {!ringkas && (
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold leading-tight">SMK Muhammadiyah 1</p>
          <p className="truncate text-xs opacity-80">Paguyangan · Penilaian Akademik</p>
        </div>
      )}
    </div>
  );
}

export function AppLayout({
  judul,
  deskripsi,
  aksi,
  children,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { akun, siap, keluar } = useAuth();
  const { sekolah, tahunAjaran, memuat, galat } = useData();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [buka, setBuka] = React.useState(false);

  React.useEffect(() => {
    if (siap && !akun) navigate({ to: "/", replace: true });
  }, [siap, akun, navigate]);

  React.useEffect(() => {
    setBuka(false);
  }, [pathname]);

  if (!siap || !akun) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        Memuat…
      </div>
    );
  }

  const menu = MENU[akun.peran];

  const isi = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
        <Logo />
        <button
          className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
          onClick={() => setBuka(false)}
          aria-label="Tutup menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menu.map((m) => {
          const aktif = pathname === m.to;
          return (
            <Link
              key={m.to}
              to={m.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                aktif
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <m.icon className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">{m.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 rounded-lg bg-sidebar-accent px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{akun.nama}</p>
          <p className="truncate text-xs opacity-80">{labelPeran[akun.peran]}</p>
        </div>
        <button
          onClick={() => {
            void keluar().then(() => navigate({ to: "/", replace: true }));
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-68 lg:block">{isi}</aside>

      {buka && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setBuka(false)}
            aria-label="Tutup menu"
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">{isi}</div>
        </div>
      )}

      <div className="lg:pl-68">
        <header className="no-print sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              className="rounded-lg border border-border p-2 lg:hidden"
              onClick={() => setBuka(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold sm:text-xl">{judul}</h1>
              {deskripsi && <p className="truncate text-xs text-muted-foreground sm:text-sm">{deskripsi}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">{aksi}</div>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          {galat ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Gagal memuat data dari server. Periksa koneksi lalu muat ulang halaman.
            </div>
          ) : memuat ? (
            <div className="grid place-items-center rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground">
              Memuat data…
            </div>
          ) : (
            children
          )}
        </main>
        <footer className="no-print border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
          {sekolah.nama} · Tahun Pelajaran {tahunAjaran.find((t) => t.aktif)?.tahun ?? "-"} ·{" "}
          {tahunAjaran.find((t) => t.aktif)?.semester ?? "-"}
        </footer>
      </div>
    </div>
  );
}

export function KartuStat({
  label,
  nilai,
  ikon: Ikon,
  catatan,
}: {
  label: string;
  nilai: React.ReactNode;
  ikon: React.ElementType;
  catatan?: string | undefined;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{nilai}</p>
          {catatan && <p className="mt-1 truncate text-xs text-muted-foreground">{catatan}</p>}
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <Ikon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
