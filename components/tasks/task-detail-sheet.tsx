'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/shared/status-pill';
import { AssigneePicker, type PickableMember } from './assignee-picker';
import { ChecklistEditor } from './checklist-editor';
import { AttachmentsList } from './attachments-list';
import { TaskComments } from './task-comments';
import { ApprovalPanel } from './approval-panel';
import {
  getTaskDetailAction,
  updateTaskDetailsAction,
  updateAssigneesAction,
  type TaskDetail,
} from '@/app/(app)/projects/[projectId]/board/task-detail-actions';
import type { TaskPriority, TaskStatus } from '@/types/domain';

export function TaskDetailSheet({
  projectId,
  taskId,
  members,
  onOpenChange,
}: {
  projectId: string;
  taskId: string | null;
  members: PickableMember[];
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!taskId) {
      setDetail(null);
      return;
    }
    setIsLoading(true);
    getTaskDetailAction(taskId).then((data) => {
      setDetail(data);
      setIsLoading(false);
    });
  }, [taskId]);

  const saveField = (fields: Parameters<typeof updateTaskDetailsAction>[2]) => {
    if (!taskId) return;
    startTransition(async () => {
      const result = await updateTaskDetailsAction(projectId, taskId, fields);
      if (!result.error) router.refresh();
    });
  };

  return (
    <Sheet open={!!taskId} onOpenChange={onOpenChange}>
      <SheetContent>
        {isLoading || !detail ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">{isLoading ? 'Loading…' : ''}</p>
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{detail.title}</SheetTitle>
              <StatusPill status={detail.status as TaskStatus} />
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-5 overflow-auto p-4">
              {detail.canApprove && (
                <ApprovalPanel
                  projectId={projectId}
                  taskId={detail.id}
                  columnId={detail.columnId}
                  onResolved={(newStatus) =>
                    setDetail((prev) => (prev ? { ...prev, status: newStatus, canApprove: false } : prev))
                  }
                />
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="detail-description">Description</Label>
                <textarea
                  id="detail-description"
                  rows={4}
                  defaultValue={detail.description ?? ''}
                  onBlur={(e) => saveField({ description: e.target.value })}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="detail-due">Due date</Label>
                  <Input
                    id="detail-due"
                    type="date"
                    defaultValue={detail.dueAt ? detail.dueAt.slice(0, 10) : ''}
                    onBlur={(e) => saveField({ dueAt: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="detail-priority">Priority</Label>
                  <select
                    id="detail-priority"
                    defaultValue={detail.priority}
                    onChange={(e) => saveField({ priority: e.target.value as TaskPriority })}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Assignees & co-actors</Label>
                <AssigneePicker
                  members={members}
                  value={detail.assigneeIds}
                  onChange={(next) => {
                    setDetail((prev) => (prev ? { ...prev, assigneeIds: next } : prev));
                    if (taskId) {
                      startTransition(async () => {
                        const result = await updateAssigneesAction(projectId, taskId, next);
                        if (!result.error) router.refresh();
                      });
                    }
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Checklist</Label>
                <ChecklistEditor projectId={projectId} taskId={detail.id} items={detail.checklist} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Attachments</Label>
                <AttachmentsList
                  projectId={projectId}
                  taskId={detail.id}
                  attachments={detail.attachments}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Comments</Label>
                <TaskComments
                  projectId={projectId}
                  taskId={detail.id}
                  columnId={detail.columnId}
                  comments={detail.comments}
                />
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
