export default function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-elevated p-3 text-center">
      <span className="block text-lg font-bold text-text-primary">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
