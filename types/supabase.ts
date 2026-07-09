// Hand-written to match db/migrations/*.sql while no live Supabase project is
// wired up. Once a project exists, regenerate the authoritative version with:
//   supabase db push && supabase gen types typescript --local > types/supabase.ts
// Keep this file's shape in sync with the migrations after every new one.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrgRole = 'owner' | 'admin' | 'manager' | 'employee';
export type ProjectRole = 'manager' | 'employee' | 'guest';
export type TaskStatus = 'not_started' | 'in_progress' | 'stuck' | 'done' | 'review';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageType = 'text' | 'photo' | 'file' | 'system';

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
      projects: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          cover_color: string;
          created_by: string;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          cover_color?: string;
          created_by: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          cover_color?: string;
          created_by?: string;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          project_role: ProjectRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          project_role?: ProjectRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          project_role?: ProjectRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      board_columns: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          position: number;
          is_default: boolean;
          archived_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          position?: number;
          is_default?: boolean;
          archived_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          position?: number;
          is_default?: boolean;
          archived_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'board_columns_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          column_id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          due_at: string | null;
          position: number;
          created_by: string;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          column_id: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_at?: string | null;
          position?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          column_id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_at?: string | null;
          position?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_column_id_fkey';
            columns: ['column_id'];
            isOneToOne: false;
            referencedRelation: 'board_columns';
            referencedColumns: ['id'];
          },
        ];
      };
      task_assignees: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          is_primary: boolean;
          is_delegator: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          is_primary?: boolean;
          is_delegator?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          is_primary?: boolean;
          is_delegator?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_assignees_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      task_checklist_items: {
        Row: {
          id: string;
          task_id: string;
          label: string;
          is_done: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          label: string;
          is_done?: boolean;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          label?: string;
          is_done?: boolean;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'task_checklist_items_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          column_id: string;
          task_id: string | null;
          author_id: string;
          body: string | null;
          attachment_url: string | null;
          message_type: MessageType;
          created_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          task_id?: string | null;
          author_id: string;
          body?: string | null;
          attachment_url?: string | null;
          message_type?: MessageType;
          created_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          task_id?: string | null;
          author_id?: string;
          body?: string | null;
          attachment_url?: string | null;
          message_type?: MessageType;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_column_id_fkey';
            columns: ['column_id'];
            isOneToOne: false;
            referencedRelation: 'board_columns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      activity_log: {
        Row: {
          id: string;
          org_id: string;
          actor_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          actor_id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          actor_id?: string;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_log_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          type: string;
          payload: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          type: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          type?: string;
          payload?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_org_id_fkey';
            columns: ['org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string | null;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { org_name: string };
        Returns: string;
      };
      create_project: {
        Args: {
          project_name: string;
          project_cover_color?: string;
          initial_member_ids?: string[];
        };
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
      is_project_member: {
        Args: { check_project_id: string };
        Returns: boolean;
      };
      has_project_role: {
        Args: { check_project_id: string; allowed_roles: ProjectRole[] };
        Returns: boolean;
      };
      get_project_org_id: {
        Args: { check_project_id: string };
        Returns: string;
      };
      get_task_project_id: {
        Args: { check_task_id: string };
        Returns: string;
      };
      get_column_project_id: {
        Args: { check_column_id: string };
        Returns: string;
      };
      can_manage_project: {
        Args: { check_project_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      org_role: OrgRole;
      project_role: ProjectRole;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      message_type: MessageType;
    };
    CompositeTypes: Record<string, never>;
  };
}
