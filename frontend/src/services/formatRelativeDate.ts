/**
 * Formate une date ISO en texte relatif français.
 * - "Aujourd'hui" si même jour
 * - "Hier" si veille
 * - "Il y a X jours" si 2-7 jours
 * - Date absolue "12 janv. 2025" au-delà
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  // Comparer les jours en local (pas en UTC)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays >= 2 && diffDays <= 7) return `Il y a ${diffDays} jours`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
