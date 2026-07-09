'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setOrgNameAction } from './org-members-actions';

export function OrgProfileForm({ orgId, initialName }: { orgId: string; initialName: string }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setOrgNameAction(orgId, name);
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
      <Button size="sm" disabled={isPending} onClick={save}>
        Save
      </Button>
      {saved && <span className="text-xs text-status-done">Saved</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
