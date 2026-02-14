import { useMemo } from "react";
import { usePlayerGroups } from "../hooks/usePlayerGroups";
import { Select } from "./ui";

interface Props {
  onChange: (groupId: number | null) => void;
  value: number | null;
}

export default function GroupFilter({ onChange, value }: Props) {
  const { groups } = usePlayerGroups();

  const options = useMemo(
    () => [
      { label: "Tous les groupes", value: "" },
      ...groups.map((g) => ({ label: g.name, value: String(g.id) })),
    ],
    [groups],
  );

  if (groups.length === 0) return null;

  return (
    <Select
      onChange={(v) => onChange(v ? Number(v) : null)}
      options={options}
      value={value !== null ? String(value) : ""}
      variant="compact"
    />
  );
}
