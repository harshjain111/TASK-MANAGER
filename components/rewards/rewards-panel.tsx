'use client';

import { useState, useTransition } from 'react';
import { Gift, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createRewardAction, deleteRewardAction, type RewardRow } from '@/app/(app)/rewards/actions';

export function RewardsPanel({
  initialRewards,
  isAdmin,
}: {
  initialRewards: RewardRow[];
  isAdmin: boolean;
}) {
  const [rewards, setRewards] = useState(initialRewards);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const add = () => {
    setError(null);
    startTransition(async () => {
      const result = await createRewardAction(title, description);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRewards((prev) => [{ id: `temp-${Date.now()}`, title, description: description || null }, ...prev]);
      setTitle('');
      setDescription('');
    });
  };

  const remove = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
    void deleteRewardAction(id);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Gift className="size-4" />
        This month&apos;s rewards
      </h2>

      {rewards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rewards configured yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rewards.map((reward) => (
            <li key={reward.id} className="flex items-start justify-between gap-2 rounded-md bg-muted/40 p-2">
              <div>
                <p className="text-sm font-medium text-foreground">{reward.title}</p>
                {reward.description && (
                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => remove(reward.id)}
                  aria-label="Remove reward"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isAdmin && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <Input placeholder="Reward title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button size="sm" variant="outline" disabled={isPending} onClick={add} className="w-fit gap-1.5">
            <Plus className="size-3.5" />
            Add reward
          </Button>
        </div>
      )}
    </div>
  );
}
