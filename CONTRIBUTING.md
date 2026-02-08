# Guide de contribution

Merci de votre intérêt pour le projet Tarot ! Ce document explique comment contribuer efficacement.

## Prérequis

- [DDEV](https://ddev.readthedocs.io/) installé et fonctionnel
- PHP 8.3+
- Node.js 20+
- Git

## Installation locale

Suivez les instructions du [README.md](README.md#démarrage-rapide) pour cloner le projet et démarrer l'environnement DDEV.

## Conventions de code

### Général

- **Ordre alphabétique** : assignations constructeur, clés de tableaux associatifs, clés YAML (chaque niveau)
- **DRY** : extraire à 3+ occurrences (ou 2 si complexe)
- **Identifiants** : en anglais (variables, fonctions, classes)
- **Textes** : en français (UI, commentaires, documentation)

### Backend (PHP / Symfony)

- **PHPStan** niveau max — analyse statique stricte
- **PHP CS Fixer** avec les règles `@Symfony` et `@Symfony:risky`
- Enums PHP pour tous les ensembles de valeurs fixes
- Groupes de sérialisation API Platform (pas de DTO custom sauf nécessité)

```bash
# Vérifier un fichier
ddev exec bash -c 'cd /var/www/html/backend && vendor/bin/phpstan analyse src/MonFichier.php'

# Corriger le style
ddev exec bash -c 'cd /var/www/html/backend && vendor/bin/php-cs-fixer fix src/MonFichier.php'
```

### Frontend (TypeScript / React)

- TypeScript en mode strict
- Composants fonctionnels uniquement
- Hooks custom pour les appels API (TanStack Query)
- Tailwind CSS 4 avec tokens de thème (jamais de couleurs en dur)
- Icônes via `lucide-react`

## Workflow Git

### Branches

- **Ne jamais pousser sur `main` directement.** Tout passe par une branche + PR.
- Nommage : `<type>/<numéro-issue>-<description>` (ex. `feat/12-star-system`, `fix/15-score-calc`)
- Une branche = une issue (correspondance 1:1)
- Brancher depuis `main`, fusionner vers `main`

### Commits

Format : `<type>(scope): description`

Types : `feat`, `fix`, `chore`, `refactor`, `docs`

Toujours référencer l'issue : ajouter `#N` dans le message ou `fixes #N` pour fermer automatiquement.

### Fusion

Stratégie **squash merge** — un seul commit par issue sur `main`.

## Soumettre une issue

1. **Vérifier les issues existantes** pour éviter les doublons
2. Utiliser les **labels existants** (`enhancement`, `bug`, etc.)
3. Décrire clairement le problème ou la fonctionnalité souhaitée
4. Ajouter des captures d'écran si pertinent

## Soumettre une PR

1. **TDD obligatoire** : écrire les tests d'abord → ils doivent échouer → implémenter → les tests passent
2. Lancer PHP CS Fixer sur tous les fichiers PHP modifiés avant de committer
3. Titre de PR au format commit : `<type>(scope): description`
4. Corps de PR : résumé + `fixes #N`
5. Vérifier que les tests passent avant de demander une review

## Tests

```bash
# Backend
ddev exec bin/phpunit

# Frontend
ddev exec bash -c 'cd /var/www/html/frontend && npm test'

# Build de production (vérifier l'absence de régression)
ddev exec bash -c 'cd /var/www/html/frontend && npm run build'
```
