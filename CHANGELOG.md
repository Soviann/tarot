# Journal des modifications

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Unreleased]

### Changed

- **Identifiants** : remplacement des UUID par des ID auto-incrémentés sur toutes les entités

### Added

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
