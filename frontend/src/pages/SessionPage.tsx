import { useParams } from "react-router-dom";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-text-primary">
        Session #{id}
      </h1>
      <p className="mt-2 text-text-muted">À venir</p>
    </div>
  );
}
