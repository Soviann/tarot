import { usePlayerGroups } from "../hooks/usePlayerGroups";

interface Props {
  onChange: (groupId: number | null) => void;
  value: number | null;
}

export default function GroupFilter({ onChange, value }: Props) {
  const { groups } = usePlayerGroups();

  if (groups.length === 0) return null;

  return (
    <select
      className="rounded-lg border border-surface-border bg-surface-primary px-3 py-2 text-sm text-text-primary"
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      value={value ?? ""}
    >
      <option value="">Tous les groupes</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>{g.name}</option>
      ))}
    </select>
  );
}
