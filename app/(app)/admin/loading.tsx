import { PanelGridSkeleton } from '@/components/shared/skeletons';

export default function Loading() {
  return <PanelGridSkeleton panels={2} label="Loading settings…" />;
}
