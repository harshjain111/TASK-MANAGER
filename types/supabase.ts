// Placeholder Database type. Regenerate after every migration with:
//   supabase gen types typescript --local > types/supabase.ts
// Filled in for real in db/migrations/0001_org_and_auth.sql (P4) onward.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
