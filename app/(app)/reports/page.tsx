import { getProjectHealth } from './project-health-actions';
import { ProjectHealthCard } from '@/components/reports/project-health-card';
import { WorkloadView } from '@/components/reports/workload-view';
import { ComingSoon } from '@/components/shared/coming-soon';
import { getCurrentOrgMembership } from '@/lib/supabase/org';

export default async function ReportsPage() {
  const [projects, membership] = await Promise.all([getProjectHealth(), getCurrentOrgMembership()]);
  const isAdmin = !!membership && ['owner', 'admin'].includes(membership.role);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Project health at a glance.</p>
      </div>

      {projects.length === 0 ? (
        <ComingSoon title="No projects yet" blurb="Project health shows up here once you have a project." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((health) => (
              <ProjectHealthCard key={health.projectId} health={health} />
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <WorkloadView
              projects={projects.map((p) => ({ id: p.projectId, name: p.projectName }))}
              isAdmin={isAdmin}
            />
          </div>
        </>
      )}
    </div>
  );
}
