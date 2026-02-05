# Tarot — Suivi des scores à 5 joueurs

Application mobile-first (PWA) pour le suivi des scores au Tarot à 5 joueurs, suivant les règles officielles de la FFT.

## Fonctionnalités

- **Gestion des joueurs** : créer et gérer les joueurs
- **Gestion des sessions** : sélectionner 5 joueurs pour démarrer ou reprendre automatiquement une session
- **Saisie des scores** : assistant en deux étapes — enregistrer l'enchère au début du tour, compléter avec les résultats à la fin
- **Correction des scores** : modifier la dernière partie d'une session
- **Statistiques** : classement global, stats par joueur, évolution des scores par session

## Stack technique

| Couche       | Technologie                                |
|--------------|--------------------------------------------|
| Backend      | Symfony 7.4, API Platform 4, PHP 8.3       |
| Base de données | MariaDB 10.11                           |
| Frontend     | React 19, TypeScript, Vite                 |
| Style        | Tailwind CSS 4                             |
| PWA          | vite-plugin-pwa                            |
| Données      | TanStack Query                             |
| Local        | DDEV                                       |

## Démarrage rapide

### Prérequis

- [DDEV](https://ddev.readthedocs.io/) installé
- Node.js 20+

### Installation

```bash
# Cloner le dépôt
git clone git@github.com:Soviann/tarot.git
cd tarot

# Démarrer l'environnement
ddev start
ddev composer install
ddev exec bin/console doctrine:migrations:migrate -n
```

### Accès

- **API Backend** : `https://tarot.ddev.site/api`
- **Frontend** : `https://tarot.ddev.site:5173` (serveur de développement Vite)

## Développement

### Backend

```bash
ddev exec bin/phpunit                              # Lancer les tests
ddev exec bin/console doctrine:migrations:diff -n  # Générer une migration
ddev exec bin/console doctrine:migrations:migrate -n  # Appliquer les migrations
```

### Frontend

```bash
ddev exec bash -c 'cd /var/www/html/frontend && npm run dev'    # Serveur de dev
ddev exec bash -c 'cd /var/www/html/frontend && npm test'       # Tests (Vitest)
ddev exec bash -c 'cd /var/www/html/frontend && npm run build'  # Build production
```

## Gestion de projet

Les issues et la roadmap sont suivies sur le tableau [Tarot - Roadmap](https://github.com/users/Soviann/projects/2).

## Documentation

- [Document de conception](docs/plans/2025-02-05-tarot-app-design.md) — architecture et choix de conception
