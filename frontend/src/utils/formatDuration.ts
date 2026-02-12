/**
 * Formate une durée en secondes en texte lisible.
 * - < 1h : "Xmin Xs" (ou "Xs" si < 60s, "Xmin" si 0s)
 * - >= 1h : "Xh Xmin" (ou "Xh" si 0min)
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}min ${seconds}s` : `${minutes}min`;
  }

  return `${seconds}s`;
}
