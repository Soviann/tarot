# Guide d'utilisation — Composants Frontend

Ce document référence l'ensemble des composants UI, hooks et types disponibles dans le frontend.
Il doit être mis à jour à chaque ajout ou modification de composant.

## Table des matières

- [Thème et mode sombre](#thème-et-mode-sombre)
- [Types / Enums](#types--enums)
- [Hooks](#hooks)
- [Pages](#pages)
- [Composants UI](#composants-ui)
- [Utilitaire de test](#utilitaire-de-test)

---

## Thème et mode sombre

### Tokens de couleur

Définis dans `frontend/src/index.css` via `@theme`. Utilisables directement comme classes Tailwind :

| Catégorie | Tokens | Exemple Tailwind |
|-----------|--------|------------------|
| **Accent** | `accent-50` à `accent-900` | `bg-accent-500`, `text-accent-300` |
| **Surface** | `surface-primary`, `surface-secondary`, `surface-tertiary`, `surface-elevated`, `surface-border` | `bg-surface-primary`, `border-surface-border` |
| **Texte** | `text-primary`, `text-secondary`, `text-muted`, `text-inverse` | `text-text-primary` |
| **Score** | `score-positive`, `score-negative` | `text-score-positive` |
| **Contrat** | `contract-petite`, `contract-garde`, `contract-garde-sans`, `contract-garde-contre` | `bg-contract-garde` |
| **Avatar** | `avatar-0` à `avatar-9` | `bg-avatar-3` |

### Mode sombre

Le mode sombre est géré via la classe `.dark` sur `<html>`. Les tokens de surface, texte et score sont automatiquement redéfinis.

```tsx
import { useTheme } from "./hooks/useTheme";

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return <button onClick={toggle}>{isDark ? "☀️" : "🌙"}</button>;
}
```

L'application doit être wrappée dans `<ThemeProvider>` (déjà fait dans `App.tsx`).

---

## Types / Enums

### Types API

**Fichier** : `frontend/src/types/api.ts`

Interfaces TypeScript correspondant aux réponses JSON-LD de l'API :

```ts
import type { HydraCollection, Player } from "./types/api";
```

| Type | Champs |
|------|--------|
| `CumulativeScore` | `playerId: number`, `playerName: string`, `score: number` |
| `Game` | `id`, `chelem`, `contract`, `createdAt`, `oudlers`, `partner`, `petitAuBout`, `poignee`, `poigneeOwner`, `points`, `position`, `scoreEntries`, `status`, `taker` |
| `GamePlayer` | `id: number`, `name: string` |
| `HydraCollection<T>` | `member: T[]`, `totalItems: number` |
| `Player` | `id: number`, `name: string`, `createdAt: string` |
| `ScoreEntry` | `id: number`, `player: GamePlayer`, `score: number` |
| `Session` | `id: number`, `createdAt: string`, `isActive: boolean`, `players: SessionPlayer[]` |
| `SessionDetail` | `id`, `createdAt`, `isActive`, `players: GamePlayer[]`, `games: Game[]`, `cumulativeScores: CumulativeScore[]` |
| `SessionPlayer` | `name: string` |

### `ApiError`

**Fichier** : `frontend/src/services/api.ts`

Classe d'erreur enrichie lancée par `apiFetch` quand la réponse HTTP n'est pas `ok` :

```ts
import { ApiError } from "./services/api";

try {
  await apiFetch("/players", { method: "POST", body: JSON.stringify({ name }) });
} catch (err) {
  if (err instanceof ApiError && err.status === 422) {
    console.log(err.body); // corps RFC 7807
  }
}
```

| Propriété | Type | Description |
|-----------|------|-------------|
| `status` | `number` | Code HTTP (ex. 422) |
| `body` | `unknown` | Corps de la réponse parsé en JSON |
| `message` | `string` | Message d'erreur (`"API error: 422"`) |

### Enums

**Fichier** : `frontend/src/types/enums.ts`

Miroir TypeScript des enums backend PHP. Utilisation en tant que valeur et type :

```tsx
import { Contract } from "./types/enums";
import type { Contract as ContractType } from "./types/enums";

// Comme valeur
const c = Contract.Garde; // "garde"

// Comme type
function foo(contract: ContractType) { ... }
```

| Enum | Valeurs |
|------|---------|
| `Chelem` | `AnnouncedLost`, `AnnouncedWon`, `None`, `NotAnnouncedWon` |
| `Contract` | `Garde`, `GardeContre`, `GardeSans`, `Petite` |
| `GameStatus` | `Completed`, `InProgress` |
| `Poignee` | `Double`, `None`, `Simple`, `Triple` |
| `Side` | `Attack`, `Defense`, `None` |

---

## Hooks

### `useTheme`

**Fichier** : `hooks/useTheme.ts`

```ts
const { isDark, toggle } = useTheme();
```

- `isDark` : `boolean` — état courant du thème
- `toggle()` — bascule light/dark, persiste dans `localStorage("theme")`

**Prérequis** : composant dans un `<ThemeProvider>`.

### `useAnimatedCounter`

**Fichier** : `hooks/useAnimatedCounter.ts`

Anime un compteur de 0 vers la valeur cible avec easing (`easeOutCubic`).

```ts
const displayed = useAnimatedCounter(score, {
  animated: true,   // défaut: true
  duration: 500,    // défaut: 500ms
});
```

### `usePlayers`

**Fichier** : `hooks/usePlayers.ts`

Récupère la liste des joueurs via l'API et applique un filtrage côté client.

```ts
const { isPending, players } = usePlayers(search);
```

| Retour | Type | Description |
|--------|------|-------------|
| `players` | `Player[]` | Liste filtrée (ou complète si `search` vide) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| `isSuccess` | `boolean` | `true` quand les données sont disponibles |
| …autres | — | Tous les champs de `UseQueryResult` |

### `useCreatePlayer`

**Fichier** : `hooks/useCreatePlayer.ts`

Mutation pour créer un nouveau joueur. Invalide le cache `["players"]` en cas de succès.

```ts
const createPlayer = useCreatePlayer();

createPlayer.mutate("Alice", {
  onSuccess: () => closeModal(),
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(name: string) => void` | Lance la création |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur (ex. doublon 422) |
| `error` | `ApiError \| null` | Détails de l'erreur |
| `reset()` | `() => void` | Réinitialise l'état d'erreur |

### `useCreateSession`

**Fichier** : `hooks/useCreateSession.ts`

Mutation pour créer (ou reprendre) une session. Convertit les IDs joueurs en IRIs API Platform.
Invalide le cache `["sessions"]` en cas de succès.

```ts
const createSession = useCreateSession();

createSession.mutate([1, 2, 3, 4, 5], {
  onSuccess: (session) => navigate(`/sessions/${session.id}`),
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(playerIds: number[]) => void` | Lance la création |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useCreateGame`

**Fichier** : `hooks/useCreateGame.ts`

Mutation pour créer une nouvelle donne dans une session. Envoie un POST avec le contrat et l'IRI du preneur.
Invalide le cache `["session", sessionId]` en cas de succès.

```ts
const createGame = useCreateGame(sessionId);

createGame.mutate({ contract: "garde", takerId: 3 });
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(input: { contract: Contract, takerId: number }) => void` | Lance la création |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useCompleteGame`

**Fichier** : `hooks/useCompleteGame.ts`

Mutation pour compléter ou modifier une donne. Envoie un PATCH avec `Content-Type: application/merge-patch+json`.
Invalide le cache `["session", sessionId]` en cas de succès.

```ts
const completeGame = useCompleteGame(gameId, sessionId);

completeGame.mutate({
  chelem: "none",
  oudlers: 2,
  partnerId: 3,       // null pour self-call
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: 45,
  status: "completed",
});
```

| Retour | Type | Description |
|--------|------|-------------|
| `mutate` | `(input: CompleteGameInput) => void` | Lance la complétion |
| `isPending` | `boolean` | `true` pendant la requête |
| `isError` | `boolean` | `true` si erreur |
| `error` | `ApiError \| null` | Détails de l'erreur |

### `useDebounce`

**Fichier** : `hooks/useDebounce.ts`

Retourne une valeur retardée qui ne se met à jour qu'après un délai sans changement.

```ts
const debouncedQuery = useDebounce(searchQuery, 300);
```

### `useSession`

**Fichier** : `hooks/useSession.ts`

Récupère le détail d'une session (joueurs, donnes, scores cumulés) via l'API.

```ts
const { isPending, session } = useSession(sessionId);
```

| Retour | Type | Description |
|--------|------|-------------|
| `session` | `SessionDetail \| null` | Détail de la session (`null` pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| `isSuccess` | `boolean` | `true` quand les données sont disponibles |
| …autres | — | Tous les champs de `UseQueryResult` |

### `useSessions`

**Fichier** : `hooks/useSessions.ts`

Récupère la liste des sessions via l'API.

```ts
const { isPending, sessions } = useSessions();
```

| Retour | Type | Description |
|--------|------|-------------|
| `sessions` | `Session[]` | Liste des sessions (vide pendant le chargement) |
| `isPending` | `boolean` | `true` pendant le chargement initial |
| `isSuccess` | `boolean` | `true` quand les données sont disponibles |
| …autres | — | Tous les champs de `UseQueryResult` |

---

## Pages

### Accueil (`Home`)

**Fichier** : `pages/Home.tsx`

Écran principal : sélection de joueurs, création de session, sessions récentes.

**Fonctionnalités** :
- Sélection de 5 joueurs via `PlayerSelector` (composant contrôlé)
- Bouton « Démarrer » (disabled si < 5 joueurs ou mutation en cours)
- Redirection vers `/sessions/:id` après création
- Message d'erreur si la création échoue
- Liste des sessions récentes via `SessionList`

**Hooks utilisés** : `useCreateSession`, `useNavigate`

### Joueurs (`Players`)

**Fichier** : `pages/Players.tsx`

Écran de gestion des joueurs : liste, recherche, ajout.

**Fonctionnalités** :
- Liste tous les joueurs avec avatar et date de création
- Recherche par nom (filtrage côté client via `SearchInput`)
- Bouton FAB (+) pour ouvrir le formulaire d'ajout
- Formulaire dans un `Modal` avec validation (doublon → message d'erreur)
- États : chargement, liste vide, résultats

**Hooks utilisés** : `usePlayers`, `useCreatePlayer`

### Session (`SessionPage`)

**Fichier** : `pages/SessionPage.tsx`

Écran principal de suivi d'une session de Tarot : tableau des scores, donne en cours, historique.

**Route** : `/sessions/:id`

**Fonctionnalités** :
- Tableau des scores cumulés (composant `Scoreboard`) avec avatars et scores colorés
- Bandeau « donne en cours » (`InProgressBanner`) si une donne est au statut `in_progress`
- Historique des donnes terminées (`GameList`) en ordre anti-chronologique
- Bouton FAB (+) pour démarrer une nouvelle donne (désactivé si donne en cours)
- Bouton retour vers l'accueil
- États : chargement, session introuvable

**Hooks utilisés** : `useSession`, `useCreateGame`, `useCompleteGame`, `useNavigate`

**Modales** :
- `NewGameModal` : sélection preneur + contrat (étape 1)
- `CompleteGameModal` : complétion ou modification d'une donne (étape 2)

---

## Composants métier

### `PlayerSelector`

**Fichier** : `components/PlayerSelector.tsx`

Composant de sélection de joueurs avec limite à 5. Inclut chips, recherche et création inline.

| Prop | Type | Description |
|------|------|-------------|
| `selectedPlayerIds` | `number[]` | *requis* — IDs des joueurs sélectionnés |
| `onSelectionChange` | `(ids: number[]) => void` | *requis* — callback de changement |

**Fonctionnalités** :
- Chips en haut avec avatar + nom des joueurs sélectionnés (clic = déselection)
- Placeholders ronds pour les places restantes
- Compteur « X/5 joueurs sélectionnés »
- `SearchInput` pour filtrer la liste
- Liste des joueurs : clic = toggle sélection, `ring-2 ring-accent-500` si sélectionné
- Joueurs non sélectionnés grisés et désactivés quand 5 sont déjà choisis
- Bouton « + Nouveau joueur » ouvrant un `Modal` de création
- Auto-sélection du joueur créé si < 5

**Hooks utilisés** : `usePlayers`, `useCreatePlayer`

### `SessionList`

**Fichier** : `components/SessionList.tsx`

Liste des sessions récentes sous forme de cartes cliquables.

**Fonctionnalités** :
- Chaque carte : noms des joueurs (jointure « , »), date fr-FR, badge « En cours » si `isActive`
- Lien vers `/sessions/:id`
- États : chargement, vide (« Aucune session »), liste

**Hooks utilisés** : `useSessions`

### `Scoreboard`

**Fichier** : `components/Scoreboard.tsx`

Bandeau horizontal scrollable affichant les 5 joueurs avec avatar, nom et score cumulé.

| Prop | Type | Description |
|------|------|-------------|
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |
| `cumulativeScores` | `CumulativeScore[]` | *requis* — scores cumulés par joueur |

### `InProgressBanner`

**Fichier** : `components/InProgressBanner.tsx`

Bandeau pour une donne en cours, affichant le preneur, le contrat et un bouton « Compléter ».

| Prop | Type | Description |
|------|------|-------------|
| `game` | `Game` | *requis* — la donne en cours |
| `onComplete` | `() => void` | *requis* — action au clic sur « Compléter » |

### `GameList`

**Fichier** : `components/GameList.tsx`

Liste des donnes terminées en ordre anti-chronologique (position décroissante).

| Prop | Type | Description |
|------|------|-------------|
| `games` | `Game[]` | *requis* — donnes terminées |
| `onEditLast` | `() => void` | *requis* — action pour modifier la dernière donne |

**Fonctionnalités** :
- Chaque carte : avatar preneur, nom, badge contrat, « avec [partenaire] » ou « Seul », score du preneur
- Bouton « Modifier » uniquement sur la dernière donne (position la plus élevée)
- État vide : « Aucune donne jouée »

### `NewGameModal`

**Fichier** : `components/NewGameModal.tsx`

Modal de création de donne (étape 1) : sélection du preneur et du contrat.

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | *requis* — afficher ou masquer |
| `onClose` | `() => void` | *requis* — fermeture |
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |
| `createGame` | `ReturnType<typeof useCreateGame>` | *requis* — mutation hook |

**Fonctionnalités** :
- Sélection du preneur via avatars avec highlight `ring-2`
- 4 boutons contrat colorés en grille 2×2
- Reset automatique à l'ouverture
- Bouton Valider désactivé tant que preneur et contrat ne sont pas sélectionnés

### `CompleteGameModal`

**Fichier** : `components/CompleteGameModal.tsx`

Modal de complétion (étape 2) ou modification d'une donne. Titre dynamique selon le statut.

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | *requis* — afficher ou masquer |
| `onClose` | `() => void` | *requis* — fermeture |
| `game` | `Game` | *requis* — donne à compléter/modifier |
| `players` | `GamePlayer[]` | *requis* — les 5 joueurs de la session |
| `sessionId` | `number` | *requis* — ID de la session |

**Fonctionnalités** :
- Bandeau info preneur + contrat (lecture seule)
- Sélection partenaire ou « Seul » (self-call)
- Stepper oudlers (0-3) avec indication points requis
- Saisie points avec inputMode numérique
- Section bonus repliable (poignée, petit au bout, chelem)
- Aperçu des scores en temps réel via `calculateScore`
- Pré-remplissage automatique en mode édition (donne complétée)

---

## Services

### `calculateScore`

**Fichier** : `services/scoreCalculator.ts`

Miroir frontend du `ScoreCalculator` backend. Calcule les scores d'une donne en temps réel pour l'aperçu.

```ts
import { calculateScore } from "./services/scoreCalculator";

const result = calculateScore({
  chelem: "none",
  contract: "garde",
  oudlers: 2,
  partnerId: 3,       // null pour self-call
  petitAuBout: "none",
  poignee: "none",
  points: 45,
});

result.attackWins;      // true
result.takerScore;      // 68
result.partnerScore;    // 34
result.defenderScore;   // -34
```

| Champ retour | Type | Description |
|-------------|------|-------------|
| `attackWins` | `boolean` | Le camp attaquant gagne-t-il ? |
| `baseScore` | `number` | Score de base (avant distribution) |
| `chelemBonus` | `number` | Bonus chelem |
| `defenderScore` | `number` | Score de chaque défenseur |
| `partnerScore` | `number` | Score du partenaire (0 si self-call) |
| `petitAuBoutBonus` | `number` | Bonus petit au bout |
| `poigneeBonus` | `number` | Bonus poignée |
| `takerScore` | `number` | Score du preneur |
| `totalPerPlayer` | `number` | Total avant distribution |

---

## Composants UI

Tous les composants sont exportés depuis `components/ui/index.ts` :

```tsx
import { ContractBadge, FAB, Modal, PlayerAvatar, ScoreDisplay, SearchInput, Stepper } from "./components/ui";
```

### `PlayerAvatar`

**Fichier** : `components/ui/PlayerAvatar.tsx`

Affiche un cercle coloré avec les initiales du joueur.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `name` | `string` | *requis* | Nom du joueur (initiales = 2 premières lettres) |
| `playerId` | `number?` | — | Prioritaire pour la couleur (`playerId % 10`) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 32px / 40px / 56px |
| `className` | `string?` | — | Classes CSS supplémentaires |

```tsx
<PlayerAvatar name="Alice" playerId={3} size="lg" />
```

### `ContractBadge`

**Fichier** : `components/ui/ContractBadge.tsx`

Badge coloré affichant le type de contrat en français.

| Prop | Type | Description |
|------|------|-------------|
| `contract` | `Contract` | Type de contrat (enum) |
| `className` | `string?` | Classes CSS supplémentaires |

```tsx
<ContractBadge contract={Contract.GardeSans} />
// Affiche : badge orange "Garde Sans"
```

### `ScoreDisplay`

**Fichier** : `components/ui/ScoreDisplay.tsx`

Affiche un score avec couleur (vert/rouge/gris) et animation optionnelle.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `value` | `number` | *requis* | Score à afficher |
| `animated` | `boolean` | `true` | Activer l'animation |
| `duration` | `number` | `500` | Durée d'animation (ms) |
| `className` | `string?` | — | Classes CSS supplémentaires |

```tsx
<ScoreDisplay value={42} />    // "+42" en vert
<ScoreDisplay value={-15} />   // "-15" en rouge
<ScoreDisplay value={0} />     // "0" en gris
```

### `FAB`

**Fichier** : `components/ui/FAB.tsx`

Bouton d'action flottant (Floating Action Button), positionné en bas à droite au-dessus du BottomNav.

| Prop | Type | Description |
|------|------|-------------|
| `aria-label` | `string` | *requis* — label d'accessibilité |
| `icon` | `ReactNode` | *requis* — icône à afficher |
| `onClick` | `() => void` | *requis* — action au clic |
| `disabled` | `boolean?` | Désactiver le bouton |
| `className` | `string?` | Classes CSS supplémentaires |

```tsx
import { Plus } from "lucide-react";
<FAB aria-label="Nouvelle donne" icon={<Plus />} onClick={handleNewGame} />
```

### `Modal`

**Fichier** : `components/ui/Modal.tsx`

Dialogue modal en portail avec focus trap et fermeture Escape/backdrop. Plein écran sur mobile, centré sur desktop.

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | *requis* — afficher ou masquer |
| `title` | `string` | *requis* — titre du dialogue |
| `onClose` | `() => void` | *requis* — fermeture (Escape, backdrop, bouton ✕) |
| `children` | `ReactNode` | Contenu du dialogue |

```tsx
<Modal open={isOpen} title="Confirmer" onClose={() => setIsOpen(false)}>
  <p>Voulez-vous vraiment supprimer ?</p>
</Modal>
```

### `Stepper`

**Fichier** : `components/ui/Stepper.tsx`

Contrôle incrémental avec boutons −/+, bornes min/max.

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` | *requis* — valeur courante |
| `min` | `number` | *requis* — borne minimum |
| `max` | `number` | *requis* — borne maximum |
| `label` | `string` | *requis* — libellé affiché |
| `onChange` | `(value: number) => void` | *requis* — callback |
| `className` | `string?` | Classes CSS supplémentaires |

```tsx
<Stepper label="Points" min={0} max={91} value={points} onChange={setPoints} />
```

### `SearchInput`

**Fichier** : `components/ui/SearchInput.tsx`

Champ de recherche avec debounce intégré et bouton d'effacement.

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `onSearch` | `(value: string) => void` | *requis* | Callback après debounce |
| `debounceMs` | `number` | `300` | Délai de debounce (ms) |
| `placeholder` | `string?` | — | Placeholder du champ |
| `className` | `string?` | — | Classes CSS supplémentaires |

```tsx
<SearchInput placeholder="Rechercher un joueur..." onSearch={setFilter} />
```

---

## Utilitaire de test

**Fichier** : `__tests__/test-utils.tsx`

```tsx
import { renderWithProviders } from "../__tests__/test-utils";

// Remplace render() avec ThemeProvider + QueryClientProvider + MemoryRouter
renderWithProviders(<MonComposant />);
```

Le `QueryClientProvider` inclus utilise un `QueryClient` de test (retry désactivé, gcTime infini).

`createTestQueryClient()` est aussi exporté pour les tests de hooks isolés.

---

## Convention

- **Imports** : utiliser le barrel export `components/ui` pour les composants UI
- **Icônes** : utiliser `lucide-react` (import nommé par icône)
- **Couleurs** : toujours utiliser les tokens de thème, jamais de couleurs hardcodées
- **Tests** : chaque composant/hook a un fichier test dans `__tests__/`
