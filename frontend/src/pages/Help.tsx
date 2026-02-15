import { ArrowLeft, ChevronDown, ExternalLink } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { Link } from "react-router-dom";

// Source : backend/src/Enum/BadgeType.php — mettre à jour si les badges changent.
const BADGE_CATEGORIES: { category: string; badges: { description: string; emoji: string; label: string }[] }[] = [
  {
    category: "Progression",
    badges: [
      { description: "Jouer sa première donne", emoji: "🎮", label: "Première donne" },
      { description: "Jouer 100 donnes", emoji: "💯", label: "Centurion" },
      { description: "Jouer 10 sessions", emoji: "🔟", label: "Habitué" },
    ],
  },
  {
    category: "Performance",
    badges: [
      { description: "5 victoires consécutives comme preneur", emoji: "🔥", label: "Inarrêtable" },
      { description: "Réussir un Chelem annoncé", emoji: "👑", label: "Premier Chelem" },
      { description: "Tenter une Garde Contre", emoji: "⚔️", label: "Kamikaze" },
      { description: "Réussir une Garde Sans", emoji: "🎯", label: "Sans filet" },
      { description: "Réussir 5 Petits au bout", emoji: "🃏", label: "Petit malin" },
      { description: "10 victoires en défense d'affilée", emoji: "🛡️", label: "Muraille" },
    ],
  },
  {
    category: "Fun",
    badges: [
      { description: "Remonter de dernier à premier en une session", emoji: "📈", label: "Comeback" },
      { description: "Finir dernier 5 fois", emoji: "💀", label: "Lanterne rouge" },
      { description: "Recevoir 10 étoiles", emoji: "⭐", label: "Collectionneur d'étoiles" },
    ],
  },
  {
    category: "Social",
    badges: [
      { description: "Jouer une session de plus de 3 heures", emoji: "⏰", label: "Marathon" },
      { description: "Jouer une donne après minuit", emoji: "🌙", label: "Noctambule" },
      { description: "Jouer avec 10 joueurs différents", emoji: "👥", label: "Sociable" },
    ],
  },
];

function AccordionSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="rounded-xl bg-surface-primary">
      <button
        aria-controls={`${id}-panel`}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-text-primary"
        id={`${id}-header`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span>{title}</span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        aria-labelledby={`${id}-header`}
        className="px-4 pb-4 text-sm leading-relaxed text-text-secondary"
        hidden={!open}
        id={`${id}-panel`}
        role="region"
      >
        {children}
      </div>
    </div>
  );
}

export default function Help() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          aria-label="Retour à l'accueil"
          className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-tertiary"
          to="/"
        >
          <ArrowLeft className="size-5 lg:size-6" />
        </Link>
        <h1 className="text-xl font-bold text-text-primary">Aide</h1>
      </div>

      {/* Installation — toujours visible */}
      <section className="rounded-xl bg-surface-primary p-4">
        <h2 className="mb-2 font-semibold text-text-primary">Installation</h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          L'application est une <strong>Progressive Web App</strong> (PWA).
          Elle s'utilise dans un navigateur mobile et peut être ajoutée à
          l'écran d'accueil :
        </p>
        <ol className="mt-2 list-inside list-decimal text-sm leading-relaxed text-text-secondary">
          <li>
            Ouvrir l'application dans <strong>Chrome</strong> (Android) ou{" "}
            <strong>Safari</strong> (iOS)
          </li>
          <li>Appuyer sur le menu du navigateur</li>
          <li>
            Sélectionner <strong>« Ajouter à l'écran d'accueil »</strong>
          </li>
          <li>L'icône apparaît comme une application native</li>
        </ol>
      </section>

      {/* Sections en accordéon */}
      <AccordionSection title="Concepts clés">
        <table className="w-full text-left">
          <tbody>
            <tr className="border-b border-surface-border">
              <td className="py-1.5 pr-3 font-medium text-text-primary">
                Joueur
              </td>
              <td className="py-1.5">Personne inscrite dans l'application</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5 pr-3 font-medium text-text-primary">
                Session
              </td>
              <td className="py-1.5">
                Partie regroupant exactement 5 joueurs
              </td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5 pr-3 font-medium text-text-primary">
                Donne
              </td>
              <td className="py-1.5">
                Un tour de jeu (une « main ») produisant des scores
              </td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5 pr-3 font-medium text-text-primary">
                Preneur
              </td>
              <td className="py-1.5">Le joueur qui a annoncé un contrat</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5 pr-3 font-medium text-text-primary">
                Partenaire
              </td>
              <td className="py-1.5">
                Le joueur dont le roi a été appelé par le preneur
              </td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5 pr-3 font-medium text-text-primary">
                Contrat
              </td>
              <td className="py-1.5">
                Petite, Garde, Garde Sans ou Garde Contre
              </td>
            </tr>
            <tr>
              <td className="py-1.5 pr-3 font-medium text-text-primary">
                Donneur
              </td>
              <td className="py-1.5">
                Distribue les cartes, tourne automatiquement
              </td>
            </tr>
          </tbody>
        </table>
      </AccordionSection>

      <AccordionSection title="Gestion des joueurs">
        <p>
          Accessible via l'onglet <strong>Joueurs</strong> dans la barre de
          navigation.
        </p>
        <h3 className="mt-3 font-medium text-text-primary">
          Ajouter un joueur
        </h3>
        <ol className="mt-1 list-inside list-decimal">
          <li>Appuyer sur le bouton + (en bas à droite)</li>
          <li>Saisir le nom du joueur</li>
          <li>Valider</li>
        </ol>
        <p className="mt-2">
          Chaque joueur possède un avatar coloré généré automatiquement à
          partir de ses initiales.
        </p>
        <h3 className="mt-3 font-medium text-text-primary">Rechercher</h3>
        <p className="mt-1">
          Utiliser la barre de recherche en haut de la liste pour filtrer par
          nom.
        </p>
      </AccordionSection>

      <AccordionSection title="Groupes de joueurs">
        <p>
          Les groupes permettent de créer des cercles de jeu (ex :
          « soirées du mardi », « famille ») et d'afficher des
          statistiques propres à chaque groupe.
        </p>
        <h3 className="mt-3 font-medium text-text-primary">Créer un groupe</h3>
        <ol className="mt-1 list-inside list-decimal">
          <li>Aller dans l'onglet <strong>Groupes</strong></li>
          <li>Appuyer sur le bouton +</li>
          <li>Saisir un nom et sélectionner les joueurs membres</li>
          <li>Valider</li>
        </ol>
        <h3 className="mt-3 font-medium text-text-primary">Association automatique</h3>
        <p className="mt-1">
          Quand tous les joueurs d'une session appartiennent à un seul
          groupe, la session est automatiquement associée à ce groupe.
        </p>
        <h3 className="mt-3 font-medium text-text-primary">Association manuelle</h3>
        <p className="mt-1">
          Le sélecteur de groupe en haut de l'écran de session permet de
          changer manuellement le groupe. Les joueurs non membres sont
          automatiquement ajoutés au groupe.
        </p>
        <h3 className="mt-3 font-medium text-text-primary">Statistiques par groupe</h3>
        <p className="mt-1">
          Sur la page Statistiques, un filtre permet de voir les classements
          et scores uniquement pour les sessions d'un groupe donné.
        </p>
      </AccordionSection>

      <AccordionSection title="Démarrer une session">
        <ol className="list-inside list-decimal">
          <li>
            Sélectionner <strong>5 joueurs</strong> parmi la liste
          </li>
          <li>
            Appuyer sur <strong>« Démarrer »</strong>
          </li>
        </ol>
        <p className="mt-2">
          Si une session active existe déjà avec les mêmes 5 joueurs,
          l'application la reprend automatiquement.
        </p>
        <p className="mt-2">
          Le <strong>donneur</strong> est attribué automatiquement (premier
          joueur par ordre alphabétique) et tourne après chaque donne.
        </p>
        <p className="mt-2">
          Pour <strong>changer le donneur manuellement</strong>, appuyer sur
          l'icône de cartes (badge bleu) du donneur actuel dans le tableau des
          scores, puis sélectionner le nouveau donneur.
        </p>
      </AccordionSection>

      <AccordionSection title="Écran de session">
        <h3 className="font-medium text-text-primary">Tableau des scores</h3>
        <p className="mt-1">
          Bandeau horizontal avec les 5 joueurs, leur score cumulé (vert =
          positif, rouge = négatif) et une icône de cartes sur le donneur.
          Appuyer sur cette icône pour changer le donneur manuellement.
        </p>

        <h3 className="mt-3 font-medium text-text-primary">Donne en cours</h3>
        <p className="mt-1">
          Si une donne est en cours, un bandeau indique le preneur et le
          contrat avec un bouton « Compléter ».
        </p>

        <h3 className="mt-3 font-medium text-text-primary">Historique</h3>
        <p className="mt-1">
          Liste des donnes jouées montrant le preneur, le partenaire, le
          contrat et le résultat.
        </p>

        <h3 className="mt-3 font-medium text-text-primary">
          Modifier les joueurs
        </h3>
        <p className="mt-1">
          Bouton ⇄ pour changer un ou plusieurs joueurs sans repasser par
          l'accueil. Désactivé tant qu'une donne est en cours.
        </p>
      </AccordionSection>

      <AccordionSection title="Saisir une donne">
        <h3 className="font-medium text-text-primary">
          Étape 1 — Début de la donne
        </h3>
        <ol className="mt-1 list-inside list-decimal">
          <li>Sélectionner le preneur</li>
          <li>Choisir le contrat (Petite ×1, Garde ×2, Garde Sans ×4, Garde Contre ×6)</li>
          <li>Valider</li>
        </ol>
        <p className="mt-2">
          Le raccourci <strong>« Même config »</strong> pré-remplit le preneur
          et le contrat de la dernière donne.
        </p>

        <h3 className="mt-3 font-medium text-text-primary">
          Étape 2 — Fin de la donne
        </h3>
        <ol className="mt-1 list-inside list-decimal">
          <li>Sélectionner le partenaire (ou « Seul »)</li>
          <li>Nombre d'oudlers (0 à 3)</li>
          <li>Points réalisés (0 à 91)</li>
          <li>Bonus optionnels (poignée, petit au bout, chelem)</li>
          <li>Vérifier l'aperçu des scores et valider</li>
        </ol>

        <h3 className="mt-3 font-medium text-text-primary">
          Modifier / Supprimer
        </h3>
        <p className="mt-1">
          Seule la dernière donne est modifiable ou supprimable. Les scores
          sont automatiquement recalculés.
        </p>
      </AccordionSection>

      <AccordionSection title="Consulter les statistiques">
        <h3 className="font-medium text-text-primary">Classement global</h3>
        <p className="mt-1">
          Métriques (total donnes/sessions), classement par score total et
          répartition des contrats.
        </p>

        <h3 className="mt-3 font-medium text-text-primary">
          Statistiques par joueur
        </h3>
        <p className="mt-1">
          Appuyer sur un joueur pour voir : taux de victoire, score moyen,
          meilleur/pire score, répartition des rôles, contrats pris et
          évolution des scores.
        </p>

        <h3 className="mt-3 font-medium text-text-primary">
          Graphique de session
        </h3>
        <p className="mt-1">
          Un graphique d'évolution apparaît automatiquement dans l'écran de
          session dès 2 donnes terminées.
        </p>
      </AccordionSection>

      <AccordionSection title="Système d'étoiles">
        <p>
          Les étoiles permettent de pénaliser un joueur (retard, mauvaise
          conduite, etc.).
        </p>
        <ul className="mt-2 list-inside list-disc">
          <li>Appuyer sur la zone d'étoiles sous le score d'un joueur</li>
          <li>
            À <strong>3 étoiles</strong> : pénalité automatique (−100 pts pour
            le joueur, +25 pts pour les 4 autres)
          </li>
          <li>Le compteur revient à 0 après chaque pénalité</li>
        </ul>
        <p className="mt-2">
          Les pénalités sont incluses dans les scores cumulés et les
          statistiques.
        </p>
      </AccordionSection>

      <AccordionSection title="Classement ELO">
        <p>
          Le système ELO fournit un classement dynamique tenant compte du
          niveau des adversaires.
        </p>
        <ul className="mt-2 list-inside list-disc">
          <li>Chaque joueur démarre à 1500 ELO</li>
          <li>
            Battre des joueurs mieux classés rapporte plus de points
          </li>
          <li>
            Le preneur voit son ELO évoluer plus fortement que le partenaire
            ou les défenseurs
          </li>
        </ul>
        <p className="mt-2">
          Visible dans les statistiques globales et sur la fiche de chaque
          joueur.
        </p>
      </AccordionSection>

      <AccordionSection title="Badges">
        <div className="space-y-4">
          {BADGE_CATEGORIES.map(({ badges, category }) => (
            <div key={category}>
              <h3 className="font-medium text-text-primary">{category}</h3>
              <div className="mt-2 space-y-2">
                {badges.map((badge) => (
                  <div key={badge.label} className="flex items-start gap-3">
                    <span className="text-xl">{badge.emoji}</span>
                    <div>
                      <span className="text-sm font-medium text-text-primary">{badge.label}</span>
                      <p className="text-xs text-text-muted">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection title="Utilisation sur Smart TV">
        <p>
          Compatible avec les Smart TV Samsung (Tizen 5.0+) et LG (webOS
          5.0+).
        </p>
        <ul className="mt-2 list-inside list-disc">
          <li>Ouvrir le navigateur intégré de la TV</li>
          <li>L'interface s'adapte automatiquement à l'écran large</li>
          <li>
            Navigation à la télécommande : flèches + Enter/OK
          </li>
          <li>Un anneau bleu indique l'élément focalisé</li>
        </ul>
      </AccordionSection>

      <AccordionSection title="Thème sombre">
        <p>
          L'application supporte un mode sombre. Appuyer sur l'icône{" "}
          <strong>lune</strong> (☽) en haut à droite de l'écran, à gauche de
          l'icône d'aide, pour basculer. En mode sombre, l'icône devient un{" "}
          <strong>soleil</strong> (☀).
        </p>
        <p className="mt-2">
          Au premier lancement, l'application suit la préférence système du
          navigateur. Le choix est ensuite mémorisé automatiquement et persiste
          entre les visites.
        </p>
      </AccordionSection>

      <AccordionSection title="Règles de calcul des scores">
        <h3 className="font-medium text-text-primary">
          Points nécessaires pour gagner
        </h3>
        <table className="mt-1 w-full text-left">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="py-1.5 font-medium text-text-primary">
                Oudlers
              </th>
              <th className="py-1.5 font-medium text-text-primary">
                Points requis
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">0</td>
              <td className="py-1.5">56</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">1</td>
              <td className="py-1.5">51</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">2</td>
              <td className="py-1.5">41</td>
            </tr>
            <tr>
              <td className="py-1.5">3</td>
              <td className="py-1.5">36</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mt-3 font-medium text-text-primary">Score de base</h3>
        <p className="mt-1">
          (|points réalisés − points requis| + 25) × multiplicateur du contrat
        </p>
        <p className="mt-1">
          Petite ×1, Garde ×2, Garde Sans ×4, Garde Contre ×6
        </p>

        <h3 className="mt-3 font-medium text-text-primary">Bonus</h3>
        <table className="mt-1 w-full text-left">
          <tbody>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">Poignée simple</td>
              <td className="py-1.5">+20</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">Poignée double</td>
              <td className="py-1.5">+30</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">Poignée triple</td>
              <td className="py-1.5">+40</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">Petit au bout</td>
              <td className="py-1.5">10 × multiplicateur</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">Chelem annoncé gagné</td>
              <td className="py-1.5">+400</td>
            </tr>
            <tr className="border-b border-surface-border">
              <td className="py-1.5">Chelem annoncé perdu</td>
              <td className="py-1.5">−200</td>
            </tr>
            <tr>
              <td className="py-1.5">Chelem non annoncé gagné</td>
              <td className="py-1.5">+200</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mt-3 font-medium text-text-primary">
          Répartition (5 joueurs)
        </h3>
        <p className="mt-1">
          Preneur : base × 2 | Partenaire : base × 1 | Chaque défenseur :
          base × −1
        </p>
        <p className="mt-1">
          Si le preneur appelle son propre roi : Preneur × 4, chaque
          défenseur × −1.
        </p>
        <p className="mt-2 text-xs text-text-muted">
          La somme des scores est toujours égale à 0.
        </p>
      </AccordionSection>

      {/* Lien GitHub */}
      <a
        className="flex items-center justify-center gap-2 rounded-xl bg-surface-primary px-4 py-3 text-sm font-medium text-accent-500 hover:bg-surface-tertiary dark:text-accent-300"
        href="https://github.com/Soviann/tarot"
        rel="noopener noreferrer"
        target="_blank"
      >
        <ExternalLink className="size-4" />
        Voir le projet sur GitHub
      </a>
    </div>
  );
}
