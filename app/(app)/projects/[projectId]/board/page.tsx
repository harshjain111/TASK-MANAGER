import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function BoardPage({ params }: { params: { projectId: string } }) {
  let project: { id: string; name: string; cover_color: string } | null = null;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('id, name, cover_color')
      .eq('id', params.projectId)
      .maybeSingle();
    project = data;
  } catch {
    project = null;
  }

  if (!project) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: project.cover_color }}
        >
          {project.name.slice(0, 1).toUpperCase()}
        </span>
        <h1 className="text-sm font-semibold text-foreground">{project.name}</h1>
      </div>
      <div className="flex flex-1 items-center justify-center text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Board columns and task cards land here in P9–P11.
        </p>
      </div>
    </div>
  );
}
