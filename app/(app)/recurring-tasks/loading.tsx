import { ListSkeleton } from '@/components/shared/skeletons';

export default function Loading() {
  return <ListSkeleton rows={5} label="Loading recurring tasks…" />;
}
