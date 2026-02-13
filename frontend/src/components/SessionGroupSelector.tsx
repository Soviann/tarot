import { usePlayerGroups } from "../hooks/usePlayerGroups";
import { useUpdateSessionGroup } from "../hooks/useUpdateSessionGroup";

interface Props {
  currentGroupId: number | null;
  sessionId: number;
}

export default function SessionGroupSelector({ currentGroupId, sessionId }: Props) {
  const { groups } = usePlayerGroups();
  const updateGroup = useUpdateSessionGroup(sessionId);

  if (groups.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    updateGroup.mutate(value ? Number(value) : null);
  };

  return (
    <select
      className="rounded-lg border border-surface-border bg-surface-primary px-2 py-1 text-sm text-text-primary disabled:opacity-50"
      disabled={updateGroup.isPending}
      onChange={handleChange}
      value={currentGroupId ?? ""}
    >
      <option value="">Aucun groupe</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>{g.name}</option>
      ))}
    </select>
  );
}
