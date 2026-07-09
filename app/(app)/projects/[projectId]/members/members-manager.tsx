'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { Button } from '@/components/ui/button';
import {
  addProjectMemberAction,
  removeProjectMemberAction,
  setGuestColumnAccessAction,
} from './actions';
import type { ProjectRole } from '@/types/domain';

type Member = { id: string; userId: string; name: string; role: ProjectRole; columnIds: string[] };
type Column = { id: string; name: string };

function ColumnCheckboxes({
  columns,
  value,
  onChange,
}: {
  columns: Column[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {columns.map((column) => {
        const checked = value.includes(column.id);
        return (
          <label
            key={column.id}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) =>
                onChange(
                  e.target.checked ? [...value, column.id] : value.filter((id) => id !== column.id),
                )
              }
            />
            {column.name}
          </label>
        );
      })}
    </div>
  );
}

export function MembersManager({
  projectId,
  members,
  columns,
  addableMembers,
  canManage,
}: {
  projectId: string;
  members: Member[];
  columns: Column[];
  addableMembers: { userId: string; name: string }[];
  canManage: boolean;
}) {
  const [rows, setRows] = useState(members);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<ProjectRole>('employee');
  const [newColumnIds, setNewColumnIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const addMember = () => {
    if (!newUserId) return;
    const person = addableMembers.find((m) => m.userId === newUserId);
    if (!person) return;

    startTransition(async () => {
      const result = await addProjectMemberAction(projectId, newUserId, newRole, newColumnIds);
      if (!result.error) {
        setRows((prev) => [
          ...prev,
          { id: `temp-${Date.now()}`, userId: newUserId, name: person.name, role: newRole, columnIds: newColumnIds },
        ]);
        setNewUserId('');
        setNewRole('employee');
        setNewColumnIds([]);
      }
    });
  };

  const removeMember = (member: Member) => {
    setRows((prev) => prev.filter((m) => m.id !== member.id));
    void removeProjectMemberAction(projectId, member.id);
  };

  const updateGuestAccess = (member: Member, columnIds: string[]) => {
    setRows((prev) => prev.map((m) => (m.id === member.id ? { ...m, columnIds } : m)));
    void setGuestColumnAccessAction(projectId, member.userId, columnIds);
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Members</h2>
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((member) => (
            <li key={member.id} className="flex flex-col gap-2 py-2">
              <div className="flex items-center gap-2">
                <Avatar name={member.name} seed={member.userId} size="sm" />
                <span className="flex-1 text-sm text-foreground">{member.name}</span>
                <span className="text-xs capitalize text-muted-foreground">{member.role}</span>
                {canManage && (
                  <button
                    onClick={() => removeMember(member)}
                    aria-label="Remove member"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {member.role === 'guest' && canManage && (
                <div className="pl-8">
                  <ColumnCheckboxes
                    columns={columns}
                    value={member.columnIds}
                    onChange={(next) => updateGuestAccess(member, next)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {canManage && addableMembers.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Add member</h2>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a person</option>
                {addableMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as ProjectRole)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="guest">Guest</option>
              </select>
            </div>

            {newRole === 'guest' && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Columns this guest can see (leave empty to grant none yet):
                </p>
                <ColumnCheckboxes columns={columns} value={newColumnIds} onChange={setNewColumnIds} />
              </div>
            )}

            <Button size="sm" disabled={!newUserId || isPending} onClick={addMember} className="w-fit">
              Add member
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
