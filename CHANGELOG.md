# Journal des modifications

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Added

- **Design system** : thème Tailwind CSS 4 complet avec tokens de couleur (accent, surface, texte, score, contrat, avatar) et support du mode sombre via `@custom-variant dark`
- **ThemeProvider** : contexte React + hook `useTheme` pour basculer light/dark avec persistance localStorage et respect de `prefers-color-scheme`
- **Types frontend** : miroir TypeScript des enums backend (Contract, Chelem, GameStatus, Poignee, Side) en `as const`
- **PlayerAvatar** : composant avatar avec initiales (support noms composés), couleur déterministe (10 couleurs) et 3 tailles (sm/md/lg)
- **ContractBadge** : badge coloré par type de contrat (Petite/Garde/Garde Sans/Garde Contre)
- **ScoreDisplay** : affichage de score avec couleur positive/négative/neutre, animation rAF et tabular-nums
- **FAB** : bouton d'action flottant fixe, 56px, couleur accent, support disabled
- **Modal** : dialogue en portail avec focus trap, fermeture Escape/backdrop, `aria-labelledby`, plein écran mobile
- **Stepper** : contrôle incrémental −/+ avec bornes min/max, ARIA `role=group` et tap targets 44px
- **SearchInput** : champ de recherche avec debounce configurable et bouton clear
- **Hooks utilitaires** : `useAnimatedCounter` (animation rAF), `useDebounce` (délai configurable)
- **Documentation** : guide utilisateur (`docs/user-guide.md`) et référence développeur (`docs/frontend-usage.md`)
- **Tests frontend** : 61 tests (12 fichiers) couvrant tous les composants et hooks
- **Initialisation du projet** : CLAUDE.md, README.md, CHANGELOG.md, document de conception
- **Document de conception** : architecture complète et design UI de l'application de scores au Tarot
- **Projet GitHub** : 12 issues créées et organisées sur le tableau Tarot - Roadmap
- **Configuration DDEV** : PHP 8.3, MariaDB 10.11, exposition du port Vite pour le serveur de dev frontend
- **Backend Symfony 7.4** : squelette Symfony avec API Platform 4, Doctrine ORM, NelmioCorsBundle
- **Frontend React 19** : application TypeScript avec Vite, Tailwind CSS 4, TanStack Query, React Router, PWA
- **Structure frontend** : routing avec 3 pages (Accueil, Stats, Joueurs), layout avec navigation basse, client API
- **Environnement de test** : base de données db_test configurée, PHPUnit opérationnel
- **Qualité backend** : PHP CS Fixer (@Symfony + risky) et PHPStan (niveau max) avec hook PostToolUse automatique
- **Service ScoreCalculator** : calcul des scores FFT pour le jeu à 5 joueurs avec bonus (poignée, petit au bout, chelem) et distribution preneur/partenaire/défenseurs
- **Tests ScoreCalculator** : 35 tests unitaires couvrant tous les contrats, bonus, distribution avec/sans partenaire et invariant somme=0
- **API Player** : CRUD complet (GET, POST, PATCH) avec validation unicité du nom et groupes de sérialisation
- **API Session** : smart-create (retrouve session active existante avec les mêmes joueurs), détail avec scores cumulés via DQL, filtrage par joueurs
- **API Game** : sous-ressource `/sessions/{id}/games`, création en 2 étapes (preneur+contrat → complétion), calcul automatique des scores via ScoreCalculator, édition de la dernière donne avec recalcul
- **Validation métier** : `OnlyLastGameEditable` (seule la dernière donne modifiable), `PlayersBelongToSession` (preneur/partenaire de la session)
- **Tests API fonctionnels** : 22 tests (Player, Session, Game, FullFlow E2E) avec `dama/doctrine-test-bundle` pour l'isolation par transaction
