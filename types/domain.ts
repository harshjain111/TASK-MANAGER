import type { Database } from '@/types/supabase';

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrgMember = Database['public']['Tables']['org_members']['Row'];
export type OrgInvite = Database['public']['Tables']['org_invites']['Row'];
export type OrgRole = Database['public']['Enums']['org_role'];
