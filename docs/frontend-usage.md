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
| `Player` | `id: number`, `name: string`, `createdAt: string` |
| `HydraCollection<T>` | `member: T[]`, `totalItems: number` |

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

### `useDebounce`

**Fichier** : `hooks/useDebounce.ts`

Retourne une valeur retardée qui ne se met à jour qu'après un délai sans changement.

```ts
const debouncedQuery = useDebounce(searchQuery, 300);
```

---

## Pages

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
