import * as React from "react";
import { Search } from "lucide-react";

export function PanelTabel({
  children,
  cari,
  onCari,
  placeholder = "Cari…",
  filter,
}: {
  children: React.ReactNode;
  cari?: string;
  onCari?: (v: string) => void;
  placeholder?: string;
  filter?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {(onCari || filter) && (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          {onCari && (
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={cari}
                onChange={(e) => onCari(e.target.value)}
                placeholder={placeholder}
                maxLength={60}
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
          )}
          {filter && <div className="flex flex-wrap items-center gap-2">{filter}</div>}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function Pilih({
  nilai,
  onUbah,
  opsi,
  label,
}: {
  nilai: string;
  onUbah: (v: string) => void;
  opsi: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <select
      aria-label={label}
      value={nilai}
      onChange={(e) => onUbah(e.target.value)}
      className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
    >
      {opsi.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const thCls =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
export const tdCls = "whitespace-nowrap px-4 py-3 text-sm";

export function Lencana({
  anak,
  jenis = "netral",
}: {
  anak: React.ReactNode;
  jenis?: "sukses" | "peringatan" | "bahaya" | "netral";
}) {
  const gaya = {
    sukses: "bg-success/15 text-success",
    peringatan: "bg-warning/20 text-accent-foreground",
    bahaya: "bg-destructive/15 text-destructive",
    netral: "bg-secondary text-secondary-foreground",
  }[jenis];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${gaya}`}>{anak}</span>
  );
}

export function KosongTabel({ pesan }: { pesan: string }) {
  return (
    <tr>
      <td colSpan={12} className="px-4 py-10 text-center text-sm text-muted-foreground">
        {pesan}
      </td>
    </tr>
  );
}
