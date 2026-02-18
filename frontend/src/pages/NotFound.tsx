import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <img
        alt="L'Excuse"
        className="mb-6 w-48 rounded-lg shadow-lg"
        src="/Gemini_Generated_Image_xiamevxiamevxiam_resized.png"
      />
      <h1 className="mb-2 text-4xl font-bold">404</h1>
      <p className="mb-8 text-text-muted">
        Page introuvable — L'Excuse ne peut rien pour vous ici.
      </p>
      <Link
        className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-white hover:bg-accent-600"
        to="/"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l'accueil
      </Link>
    </div>
  );
}
