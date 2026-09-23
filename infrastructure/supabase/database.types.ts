/**
 * Placeholder hand-written types matching db/schema.sql.
 * Replace by running: npx supabase gen types typescript --project-id <id> > infrastructure/supabase/database.types.ts
 * once the project is linked — keeps this file as the single source of DB shape.
 */

type NoRelations = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      member_levels: {
        Row: { id: string; name: string; rank: number };
        Insert: { id?: string; name: string; rank: number };
        Update: Partial<{ name: string; rank: number }>;
      } & NoRelations;
      members: {
        Row: {
          id: string;
          full_name: string;
          nickname: string;
          gender: "L" | "P";
          level_id: string;
          status: "active" | "inactive";
          joined_year: number;
          photo_url: string | null;
          phone: string | null;
          address: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          nickname: string;
          gender: "L" | "P";
          level_id: string;
          status: "active" | "inactive";
          joined_year: number;
          photo_url?: string | null;
          phone?: string | null;
          address?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["members"]["Insert"]>;
      } & NoRelations;
      mass_types: {
        Row: { id: string; name: string; default_officer_count: number };
        Insert: { id?: string; name: string; default_officer_count: number };
        Update: Partial<{ name: string; default_officer_count: number }>;
      } & NoRelations;
      mass_schedules: {
        Row: {
          id: string;
          date: string;
          time: string;
          mass_type_id: string;
          officer_count: number;
          gender_composition: Record<string, unknown>;
          status: "draft" | "published";
          created_by: string;
        };
        Insert: {
          id?: string;
          date: string;
          time: string;
          mass_type_id: string;
          officer_count: number;
          gender_composition: Record<string, unknown>;
          status: "draft" | "published";
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["mass_schedules"]["Insert"]>;
      } & NoRelations;
      schedule_assignments: {
        Row: {
          id: string;
          schedule_id: string;
          member_id: string;
          order: number;
          status: "assigned" | "swapped";
          original_member_id: string | null;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          member_id: string;
          order: number;
          status: "assigned" | "swapped";
          original_member_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["schedule_assignments"]["Insert"]>;
      } & NoRelations;
      attendance_sessions: {
        Row: { id: string; type: string; date: string; created_by: string };
        Insert: { id?: string; type: string; date: string; created_by: string };
        Update: Partial<Database["public"]["Tables"]["attendance_sessions"]["Insert"]>;
      } & NoRelations;
      attendance_records: {
        Row: { id: string; session_id: string; member_id: string; present: boolean };
        Insert: { id?: string; session_id: string; member_id: string; present: boolean };
        Update: Partial<Database["public"]["Tables"]["attendance_records"]["Insert"]>;
      } & NoRelations;
      swap_requests: {
        Row: {
          id: string;
          assignment_id: string;
          requested_by_member_id: string;
          replacement_member_id: string | null;
          status: string;
          reason: string | null;
          created_at: string;
          decided_by: string | null;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          requested_by_member_id: string;
          replacement_member_id?: string | null;
          status: string;
          reason?: string | null;
          created_at?: string;
          decided_by?: string | null;
          decided_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["swap_requests"]["Insert"]>;
      } & NoRelations;
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          published: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          published: boolean;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
      } & NoRelations;
      profiles: {
        Row: { id: string; full_name: string; role: "pengurus" | "admin"; created_at: string };
        Insert: { id: string; full_name: string; role: "pengurus" | "admin"; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      } & NoRelations;
    };
    Views: {
      public_members: {
        Row: { id: string; full_name: string; nickname: string; photo_url: string | null };
      } & NoRelations;
    };
    Functions: Record<string, never>;
  };
}
