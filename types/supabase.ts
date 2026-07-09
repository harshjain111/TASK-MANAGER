// Hand-written to match db/migrations/*.sql while no live Supabase project is
// wired up. Once a project exists, regenerate the authoritative version with:
//   supabase db push && supabase gen types typescript --local > types/supabase.ts
// Keep this file's shape in sync with the migrations after every new one.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrgRole = 'owner' | 'admin' | 'manager' | 'employee';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          org_role: OrgRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          org_role?: OrgRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          org_role?: OrgRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'org_members_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      org_invites: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          org_role: OrgRole;
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          org_role?: OrgRole;
          token?: string;
          invited_by: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          org_role?: OrgRole;
          token?: string;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'org_invites_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { org_name: string };
        Returns: string;
      };
      is_org_member: {
        Args: { check_org_id: string };
        Returns: boolean;
      };
      has_org_role: {
        Args: { check_org_id: string; allowed_roles: OrgRole[] };
        Returns: boolean;
      };
      get_org_invite: {
        Args: { invite_token: string };
        Returns: { org_name: string; org_role: OrgRole; email: string }[];
      };
      accept_org_invite: {
        Args: { invite_token: string };
        Returns: string;
      };
    };
    Enums: {
      org_role: OrgRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
