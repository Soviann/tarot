import { Modal } from "./ui";
import type { PlayerGroup } from "../types/api";

interface Props {
  currentGroupId: number | null;
  groups: PlayerGroup[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (groupId: number | null) => void;
  open: boolean;
}

export default function ChangeGroupModal({
  currentGroupId,
  groups,
  isPending,
  onClose,
  onConfirm,
  open,
}: Props) {
  return (
    <Modal onClose={onClose} open={open} title="Changer le groupe">
      <div className="flex flex-col gap-2">
        <button
          aria-label="Aucun groupe"
          className={`rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
            currentGroupId === null
              ? "bg-accent-500/10 text-accent-500 ring-2 ring-accent-500"
              : "bg-surface-secondary text-text-primary hover:bg-surface-tertiary"
          }`}
          disabled={isPending}
          onClick={() => onConfirm(null)}
          type="button"
        >
          Aucun groupe
        </button>
        {groups.map((group) => (
          <button
            aria-label={group.name}
            className={`rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
              currentGroupId === group.id
                ? "bg-accent-500/10 text-accent-500 ring-2 ring-accent-500"
                : "bg-surface-secondary text-text-primary hover:bg-surface-tertiary"
            }`}
            disabled={isPending}
            key={group.id}
            onClick={() => onConfirm(group.id)}
            type="button"
          >
            {group.name}
          </button>
        ))}
      </div>
    </Modal>
  );
}
