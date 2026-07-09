import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/shared/avatar';

export type TeamMember = {
  userId: string;
  name: string;
  email: string;
  role: string;
  lastActiveAt: string | null;
  projects: string[];
};

function presenceLabel(lastActiveAt: string | null): { label: string; online: boolean } {
  if (!lastActiveAt) return { label: 'Never active', online: false };
  const minutesAgo = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (minutesAgo < 5) return { label: 'Active now', online: true };
  return { label: `Active ${formatDistanceToNow(new Date(lastActiveAt), { addSuffix: true })}`, online: false };
}

export function TeamDirectory({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">No team members yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
      {members.map((member) => {
        const presence = presenceLabel(member.lastActiveAt);
        return (
          <li key={member.userId} className="flex items-center gap-3 p-3">
            <div className="relative shrink-0">
              <Avatar name={member.name} seed={member.userId} />
              <span
                className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card ${
                  presence.online ? 'bg-status-done' : 'bg-status-not-started'
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {member.email} · <span className="capitalize">{member.role}</span>
              </p>
              {member.projects.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {member.projects.map((project) => (
                    <span
                      key={project}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {project}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{presence.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
