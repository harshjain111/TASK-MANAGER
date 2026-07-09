import type { Database } from '@/types/supabase';

export type Organization = Database['public']['Tables']['organizations']['Row'];
export type OrgMember = Database['public']['Tables']['org_members']['Row'];
export type OrgInvite = Database['public']['Tables']['org_invites']['Row'];
export type OrgRole = Database['public']['Enums']['org_role'];

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectMember = Database['public']['Tables']['project_members']['Row'];
export type ProjectRole = Database['public']['Enums']['project_role'];

export type BoardColumn = Database['public']['Tables']['board_columns']['Row'];

export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskAssignee = Database['public']['Tables']['task_assignees']['Row'];
export type TaskChecklistItem = Database['public']['Tables']['task_checklist_items']['Row'];
export type TaskAttachment = Database['public']['Tables']['task_attachments']['Row'];
export type TaskStatus = Database['public']['Enums']['task_status'];
export type TaskPriority = Database['public']['Enums']['task_priority'];

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type MessageType = Database['public']['Enums']['message_type'];

export type ActivityLogEntry = Database['public']['Tables']['activity_log']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type Mute = Database['public']['Tables']['mutes']['Row'];

export type Karma = Database['public']['Tables']['karmas']['Row'];
export type KarmaRecurrenceType = Database['public']['Enums']['karma_recurrence_type'];

export type Kudos = Database['public']['Tables']['kudos']['Row'];
export type KudosKind = Database['public']['Enums']['kudos_kind'];

export type Reward = Database['public']['Tables']['rewards']['Row'];
