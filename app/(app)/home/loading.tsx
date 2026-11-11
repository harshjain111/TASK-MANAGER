import { ListSkeleton } from '@/components/shared/skeletons';

export default function Loading() {
  return <ListSkeleton rows={6} label="Loading your day…" />;
}
