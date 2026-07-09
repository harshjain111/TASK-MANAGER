'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { updateMemberRoleAction, removeMemberAction, type OrgMemberRow } from './org-members-actions';
import type { OrgRole } from '@/types/domain';

export function MembersTable({
  initialMembers,
  currentUserId,
}: {
  initialMembers: OrgMemberRow[];
  currentUserId: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [isPending, startTransition] = useTransition();

  const changeRole = (member: OrgMemberRow, role: OrgRole) => {
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role } : m)));
    startTransition(async () => {
      await updateMemberRoleAction(member.id, role);
    });
  };

  const remove = (member: OrgMemberRow) => {
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    void removeMemberAction(member.id);
  };

  return (
    <ul className="flex flex-col divide-y divide-border">
      {members.map((member) => {
        const isSelf = member.userId === currentUserId;
        return (
          <li key={member.id} className="flex items-center gap-3 py-2">
            <Avatar name={member.name} seed={member.userId} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {member.email} · digest {member.digestOptOut ? 'off' : 'on'}
              </p>
            </div>
            <select
              value={member.role}
              disabled={isSelf || isPending || member.role === 'owner'}
              onChange={(e) => changeRole(member, e.target.value as OrgRole)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
            >
              <option value="owner" disabled>
                Owner
              </option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
            {!isSelf && member.role !== 'owner' && (
              <button
                onClick={() => remove(member)}
                aria-label="Remove member"
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
