import { Avatar } from '@/components/shared/avatar';

export type PickableMember = { userId: string; name: string };

export function AssigneePicker({
  members,
  value,
  onChange,
}: {
  members: PickableMember[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  if (members.length === 0) {
    return <p className="text-xs text-muted-foreground">No project members to assign yet.</p>;
  }

  return (
    <div className="flex max-h-40 flex-col gap-1 overflow-auto rounded-lg border border-border p-2">
      {members.map((member) => {
        const checked = value.includes(member.userId);
        return (
          <label
            key={member.userId}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...value, member.userId]
                    : value.filter((id) => id !== member.userId),
                )
              }
            />
            <Avatar name={member.name} seed={member.userId} size="sm" />
            {member.name}
          </label>
        );
      })}
    </div>
  );
}
