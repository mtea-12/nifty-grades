export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      guru: {
        Row: {
          created_at: string
          id: string
          jk: string
          mapel_id: string | null
          nama: string
          nip: string
          telepon: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jk?: string
          mapel_id?: string | null
          nama: string
          nip: string
          telepon?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jk?: string
          mapel_id?: string | null
          nama?: string
          nip?: string
          telepon?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guru_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mata_pelajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas: {
        Row: {
          created_at: string
          id: string
          jurusan: string
          nama: string
          tingkat: string
          wali_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jurusan?: string
          nama: string
          tingkat?: string
          wali_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jurusan?: string
          nama?: string
          tingkat?: string
          wali_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_wali_id_fkey"
            columns: ["wali_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas_mapel: {
        Row: {
          kelas_id: string
          mapel_id: string
        }
        Insert: {
          kelas_id: string
          mapel_id: string
        }
        Update: {
          kelas_id?: string
          mapel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kelas_mapel_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_mapel_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mata_pelajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      log_aksi: {
        Row: {
          aksi: string
          baris_id: string | null
          created_at: string
          id: string
          pelaku_id: string | null
          pelaku_nama: string
          ringkasan: string
          tabel: string
        }
        Insert: {
          aksi: string
          baris_id?: string | null
          created_at?: string
          id?: string
          pelaku_id?: string | null
          pelaku_nama?: string
          ringkasan?: string
          tabel: string
        }
        Update: {
          aksi?: string
          baris_id?: string | null
          created_at?: string
          id?: string
          pelaku_id?: string | null
          pelaku_nama?: string
          ringkasan?: string
          tabel?: string
        }
        Relationships: []
      }
      mata_pelajaran: {
        Row: {
          created_at: string
          id: string
          kelompok: string
          kkm: number
          kode: string
          nama: string
        }
        Insert: {
          created_at?: string
          id?: string
          kelompok?: string
          kkm?: number
          kode: string
          nama: string
        }
        Update: {
          created_at?: string
          id?: string
          kelompok?: string
          kkm?: number
          kode?: string
          nama?: string
        }
        Relationships: []
      }
      nilai: {
        Row: {
          id: string
          mapel_id: string
          pas: number
          pts: number
          siswa_id: string
          tahun_ajaran_id: string
          tugas: number
          updated_at: string
        }
        Insert: {
          id?: string
          mapel_id: string
          pas?: number
          pts?: number
          siswa_id: string
          tahun_ajaran_id: string
          tugas?: number
          updated_at?: string
        }
        Update: {
          id?: string
          mapel_id?: string
          pas?: number
          pts?: number
          siswa_id?: string
          tahun_ajaran_id?: string
          tugas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nilai_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mata_pelajaran"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_tahun_ajaran_id_fkey"
            columns: ["tahun_ajaran_id"]
            isOneToOne: false
            referencedRelation: "tahun_ajaran"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nama: string
        }
        Insert: {
          created_at?: string
          id: string
          nama?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
        }
        Relationships: []
      }
      sekolah: {
        Row: {
          alamat: string
          id: string
          kepsek: string
          nama: string
          npsn: string
        }
        Insert: {
          alamat?: string
          id?: string
          kepsek?: string
          nama: string
          npsn?: string
        }
        Update: {
          alamat?: string
          id?: string
          kepsek?: string
          nama?: string
          npsn?: string
        }
        Relationships: []
      }
      siswa: {
        Row: {
          created_at: string
          id: string
          jk: string
          kelas_id: string | null
          nama: string
          nis: string
          nisn: string
          user_id: string | null
          wali: string
        }
        Insert: {
          created_at?: string
          id?: string
          jk?: string
          kelas_id?: string | null
          nama: string
          nis: string
          nisn?: string
          user_id?: string | null
          wali?: string
        }
        Update: {
          created_at?: string
          id?: string
          jk?: string
          kelas_id?: string | null
          nama?: string
          nis?: string
          nisn?: string
          user_id?: string | null
          wali?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
        ]
      }
      tahun_ajaran: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          semester: string
          tahun: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          semester: string
          tahun: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          semester?: string
          tahun?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      guru_saya: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      info_saya: {
        Args: never
        Returns: {
          guru_id: string
          kelas_wali_id: string
          mapel_id: string
          nama: string
          peran: string
          siswa_id: string
          user_id: string
        }[]
      }
      kelas_dari_siswa: { Args: { _siswa_id: string }; Returns: string }
      kelas_wali_saya: { Args: never; Returns: string }
      mapel_saya: { Args: never; Returns: string }
      siswa_saya: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "guru" | "wali" | "siswa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "guru", "wali", "siswa"],
    },
  },
} as const
