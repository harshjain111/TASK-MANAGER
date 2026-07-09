'use client';

import { useRef, useState, useTransition } from 'react';
import { Paperclip, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { addTaskAttachmentAction } from '@/app/(app)/projects/[projectId]/board/task-detail-actions';

export type Attachment = { id: string; fileName: string; fileUrl: string; createdAt: string };

export function AttachmentsList({
  projectId,
  taskId,
  attachments,
}: {
  projectId: string;
  taskId: string;
  attachments: Attachment[];
}) {
  const [localAttachments, setLocalAttachments] = useState(attachments);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file: File) => {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const path = `${taskId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('attachments').getPublicUrl(path);

      const result = await addTaskAttachmentAction(projectId, taskId, file.name, publicUrl, file.size);
      if (result.error) {
        setError(result.error);
        return;
      }

      setLocalAttachments((prev) => [
        { id: path, fileName: file.name, fileUrl: publicUrl, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {localAttachments.length > 0 && (
        <ul className="flex flex-col gap-1">
          {localAttachments.map((a) => (
            <li key={a.id}>
              <a
                href={a.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <FileText className="size-3.5 shrink-0" />
                <span className="truncate">{a.fileName}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-1.5"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="size-3.5" />
        {isPending ? 'Uploading…' : 'Attach file'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
