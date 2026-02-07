import { Link } from "react-router-dom";
import { useSessions } from "../hooks/useSessions";

export default function SessionList() {
  const { isPending, sessions } = useSessions();

  if (isPending) {
    return <p className="py-4 text-center text-text-muted">Chargement…</p>;
  }

  if (sessions.length === 0) {
    return <p className="py-4 text-center text-text-muted">Aucune session</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            className="block rounded-lg bg-surface-secondary p-3 transition-colors hover:bg-surface-tertiary"
            to={`/sessions/${session.id}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-text-primary">
                {session.players.map((p) => p.name).join(", ")}
              </p>
              {session.isActive && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  En cours
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {new Date(session.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
