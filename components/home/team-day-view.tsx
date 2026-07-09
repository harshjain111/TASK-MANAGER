'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { StatusPill } from '@/components/shared/status-pill';
import { Input } from '@/components/ui/input';
import { getTeamDayAction, type TeamDayMember } from '@/app/(app)/home/team-day-actions';
import type { TaskStatus } from '@/types/domain';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TeamDayView() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO);
  const [members, setMembers] = useState<TeamDayMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getTeamDayAction(date).then((data) => {
      setMembers(data);
      setIsLoading(false);
    });
  }, [date]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Team Day</h2>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-8 w-40 text-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {members.map((member) => {
            const hasntStarted =
              member.tasks.length > 0 && member.tasks.every((t) => t.status === 'not_started');
            const overloaded = member.tasks.length >= 5;

            return (
              <div
                key={member.userId}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <Avatar name={member.name} seed={member.userId} size="sm" />
                <span className="w-28 shrink-0 truncate text-sm font-medium text-foreground">
                  {member.name}
                </span>

                {member.tasks.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Free today</span>
                ) : (
                  <div className="flex flex-1 flex-wrap items-center gap-1.5">
                    {member.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => router.push(`/projects/${task.projectId}/board`)}
                        className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs hover:bg-muted/70"
                      >
                        <span className="max-w-32 truncate">{task.title}</span>
                        <StatusPill status={task.status as TaskStatus} className="scale-90" />
                      </button>
                    ))}
                  </div>
                )}

                {overloaded && (
                  <span
                    title="5+ tasks due today"
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-status-stuck"
                  >
                    <AlertTriangle className="size-3.5" />
                    Overloaded
                  </span>
                )}
                {hasntStarted && !overloaded && (
                  <span className="shrink-0 text-xs font-medium text-status-not-started">
                    Not started
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
