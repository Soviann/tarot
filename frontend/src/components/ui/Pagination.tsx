const PAGE_SIZE = 10;

interface LoadMoreButtonProps {
  onClick: () => void;
  remainingCount: number;
}

export default function LoadMoreButton({
  onClick,
  remainingCount,
}: LoadMoreButtonProps) {
  if (remainingCount <= 0) return null;

  const nextBatch = Math.min(remainingCount, PAGE_SIZE);

  return (
    <button
      className="w-full rounded-xl bg-surface-elevated py-2.5 text-center text-sm font-medium text-text-secondary transition-colors active:bg-surface-tertiary"
      onClick={onClick}
      type="button"
    >
      Voir plus ({nextBatch})
    </button>
  );
}

export { PAGE_SIZE };
