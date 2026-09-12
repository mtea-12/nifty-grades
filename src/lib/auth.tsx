import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Peran } from "./data";

export { akunDemo } from "./demo.functions";
export type { AkunDemo } from "./demo.functions";

export type Akun = {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  /** id guru untuk peran guru/wali, id siswa untuk peran siswa */
  refId?: string;
  kelasWaliId?: string;
  mapelId?: string;
};

export const labelPeran: Record<Peran, string> = {
  admin: "Administrator",
  guru: "Guru Mata Pelajaran",
  wali: "Wali Kelas",
  siswa: "Siswa",
};

type Ctx = {
  akun: Akun | null;
  siap: boolean;
  galat: string | null;
  masuk: (email: string, sandi: string) => Promise<{ ok: boolean; pesan?: string }>;
  keluar: () => Promise<void>;
  muatUlang: () => Promise<void>;
};

const AuthContext = React.createContext<Ctx>({
  akun: null,
  siap: false,
  galat: null,
  masuk: async () => ({ ok: false }),
  keluar: async () => {},
  muatUlang: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [akun, setAkun] = React.useState<Akun | null>(null);
  const [siap, setSiap] = React.useState(false);
  const [galat, setGalat] = React.useState<string | null>(null);

  const ambilInfo = React.useCallback(async (email: string) => {
    const { data, error } = await supabase.rpc("info_saya");
    if (error) {
      setGalat("Gagal memuat data akun. Coba muat ulang halaman.");
      return null;
    }
    const baris = Array.isArray(data) ? data[0] : data;
    if (!baris) return null;
    const peran = (baris.peran || "siswa") as Peran;
    const info: Akun = {
      id: baris.user_id as string,
      nama: baris.nama || email,
      email,
      peran,
      refId: (peran === "siswa" ? baris.siswa_id : baris.guru_id) ?? undefined,
      kelasWaliId: baris.kelas_wali_id ?? undefined,
      mapelId: baris.mapel_id ?? undefined,
    };
    setGalat(null);
    return info;
  }, []);

  const sinkron = React.useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const sesi = data.session;
    if (!sesi?.user) {
      setAkun(null);
      return;
    }
    setAkun(await ambilInfo(sesi.user.email ?? ""));
  }, [ambilInfo]);

  React.useEffect(() => {
    let aktif = true;
    void (async () => {
      await sinkron();
      if (aktif) setSiap(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void sinkron();
    });
    return () => {
      aktif = false;
      sub.subscription.unsubscribe();
    };
  }, [sinkron]);

  const masuk = React.useCallback(
    async (email: string, sandi: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: sandi,
      });
      if (error || !data.user) {
        return {
          ok: false,
          pesan:
            error?.message === "Invalid login credentials"
              ? "Email atau kata sandi salah."
              : (error?.message ?? "Gagal masuk. Coba lagi."),
        };
      }
      const info = await ambilInfo(data.user.email ?? email);
      setAkun(info);
      if (!info?.peran) {
        return { ok: false, pesan: "Akun ini belum memiliki peran. Hubungi administrator." };
      }
      return { ok: true };
    },
    [ambilInfo],
  );

  const keluar = React.useCallback(async () => {
    await supabase.auth.signOut();
    setAkun(null);
  }, []);

  const value = React.useMemo(
    () => ({ akun, siap, galat, masuk, keluar, muatUlang: sinkron }),
    [akun, siap, galat, masuk, keluar, sinkron],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => React.useContext(AuthContext);
