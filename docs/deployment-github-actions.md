# Déploiement via GitHub Actions

Guide pour mettre en place un déploiement automatisé de l'application Tarot via GitHub Actions, directement intégré au dépôt GitHub.

## Table des matières

- [Architecture du déploiement](#architecture-du-déploiement)
- [Comparaison avec Jenkins](#comparaison-avec-jenkins)
- [Prérequis](#prérequis)
- [1. Configuration des secrets depuis l'interface GitHub](#1-configuration-des-secrets-depuis-linterface-github)
- [2. Fichier workflow](#2-fichier-workflow)
- [3. Workflow détaillé — Déploiement production](#3-workflow-détaillé--déploiement-production)
- [4. Workflow optionnel — Déploiement beta](#4-workflow-optionnel--déploiement-beta)
- [5. Configuration du serveur cible](#5-configuration-du-serveur-cible)
- [6. Gestion et suivi depuis l'interface GitHub](#6-gestion-et-suivi-depuis-linterface-github)
- [7. Fonctionnalités avancées](#7-fonctionnalités-avancées)
- [Dépannage](#dépannage)

---

## Architecture du déploiement

```
┌────────────┐     git push     ┌──────────────────┐   rsync/SSH   ┌──────────────┐
│  Développeur│ ───────────────▶ │  GitHub Actions    │ ────────────▶ │  Serveur     │
│  (push sur  │                  │  (runner Ubuntu)   │  fichiers    │  cible       │
│   main)     │                  │                    │  compilés    │  (VPS OVH)   │
└────────────┘                   └──────────────────┘               └──────────────┘
                                   │                                  │
                                   ├─ composer install                ├─ migrations
                                   ├─ npm ci + build                  ├─ cache:clear
                                   └─ dump-env                        └─ cache:warmup
```

**Principe** : identique à Jenkins — le build est fait sur le runner GitHub (VM éphémère Ubuntu), puis les fichiers compilés sont envoyés au serveur via rsync/SSH. La différence majeure est que le workflow est **versionné dans le dépôt** (fichier YAML), pas configuré dans une interface externe.

---

## Comparaison avec Jenkins

| Aspect | GitHub Actions | Jenkins |
|--------|---------------|---------|
| **Configuration** | Fichier YAML dans le dépôt | Interface web externe |
| **Infrastructure** | Runners GitHub (gratuit pour repos publics, 2000 min/mois pour privés) | Serveur Jenkins auto-hébergé |
| **Versioning** | Workflow versionné avec le code | Config XML hors du dépôt |
| **Secrets** | GitHub Secrets (interface web) | Jenkins Credentials |
| **Notifications** | GitHub intégré + Slack/Discord via actions | Plugins (Mattermost, Slack…) |
| **Coût** | Gratuit (public) ou inclus dans le plan GitHub | Coût du serveur Jenkins |
| **Maintenance** | Aucune (géré par GitHub) | Mise à jour Jenkins + plugins |
| **PHP pré-installé** | Non (installé à chaque run via `setup-php`) | Oui (installé sur le serveur) |

> **Recommandation** : GitHub Actions est le choix le plus simple pour un projet hébergé sur GitHub. Jenkins est préférable si l'on a déjà une infrastructure Jenkins existante ou si l'on veut garder le build sur le réseau interne.

---

## Prérequis

### Sur GitHub

- **Dépôt** : `Soviann/tarot` (public ou privé avec minutes Actions disponibles)
- **Secrets configurés** : clé SSH, IP du serveur, utilisateur (voir section 1)

### Sur le serveur cible

- Même configuration que pour Jenkins (voir [deployment.md](./deployment.md)) :
  - PHP 8.3 CLI, MariaDB, Nginx
  - Utilisateur `deploy` avec accès SSH par clé
  - Répertoire `/var/www/tarot` accessible en écriture

---

## 1. Configuration des secrets depuis l'interface GitHub

Les secrets sont des variables chiffrées stockées par GitHub, injectées dans le workflow au moment de l'exécution. Ils ne sont **jamais** visibles dans les logs.

### Étape 1 — Accéder aux paramètres du dépôt

1. Aller sur **github.com/Soviann/tarot**
2. Cliquer sur l'onglet **Settings** (roue dentée, en haut à droite du dépôt)
3. Dans le menu de gauche, section **Security**, cliquer sur **Secrets and variables** → **Actions**

### Étape 2 — Créer les secrets

Cliquer sur **New repository secret** pour chacun des secrets suivants :

| Nom du secret | Valeur | Description |
|---------------|--------|-------------|
| `DEPLOY_SSH_KEY` | Contenu de la clé privée SSH (ex: `~/.ssh/id_ed25519`) | Clé pour se connecter au serveur cible. **Inclure** les lignes `-----BEGIN/END-----`. |
| `DEPLOY_HOST` | `123.45.67.89` | Adresse IP (ou nom d'hôte) du serveur cible |
| `DEPLOY_USER` | `deploy` | Utilisateur SSH sur le serveur cible |
| `DEPLOY_PATH` | `/var/www/tarot` | Répertoire de déploiement sur le serveur |
| `DEPLOY_PORT` | `22` | Port SSH (souvent 22, peut varier) |

Pour chaque secret :

1. **Name** : saisir le nom exact (ex: `DEPLOY_SSH_KEY`)
2. **Secret** : coller la valeur
3. Cliquer sur **Add secret**

> **Sécurité** : les secrets sont chiffrés au repos, ne sont jamais affichés dans les logs (remplacés par `***`), et ne sont pas transmis aux forks.

### Étape 3 — (Optionnel) Créer des variables d'environnement

Pour les valeurs non sensibles, utiliser les **variables** plutôt que les secrets (elles sont visibles dans les logs) :

1. Toujours dans **Settings** → **Secrets and variables** → **Actions**
2. Onglet **Variables**
3. Cliquer sur **New repository variable**

| Nom | Valeur | Description |
|-----|--------|-------------|
| `SYMFONY_ENV` | `prod` | Environnement Symfony |

### Étape 4 — (Optionnel) Environnements GitHub

Pour gérer beta et production séparément avec des secrets différents :

1. **Settings** → **Environments**
2. Cliquer sur **New environment** → nom : `production`
3. Dans l'environnement, onglet **Environment secrets** → ajouter les mêmes secrets avec les valeurs de production
4. Répéter pour l'environnement `beta` avec les valeurs beta
5. (Optionnel) **Protection rules** sur `production` :
   - Cocher **Required reviewers** → ajouter un ou plusieurs reviewers
   - Le déploiement en production nécessitera alors une approbation manuelle

---

## 2. Fichier workflow

Les workflows GitHub Actions sont des fichiers YAML placés dans `.github/workflows/`. Ils sont automatiquement détectés par GitHub.

### Structure des fichiers

```
.github/
└── workflows/
    ├── deploy-prod.yml     # Déploiement production (push sur main)
    └── deploy-beta.yml     # Déploiement beta (push sur develop) — optionnel
```

---

## 3. Workflow détaillé — Déploiement production

Fichier `.github/workflows/deploy-prod.yml` :

```yaml
name: Déploiement production

# Déclenché sur push sur main (après merge d'une PR)
on:
  push:
    branches: [main]

# Empêcher les déploiements concurrents
concurrency:
  group: deploy-production
  cancel-in-progress: false   # ne pas annuler un déploiement en cours

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
    environment: production   # Optionnel : active les protection rules

    steps:
      # ────────────────────────────────────────────
      # 1. Checkout du code
      # ────────────────────────────────────────────
      - name: Checkout du code
        uses: actions/checkout@v4

      # ────────────────────────────────────────────
      # 2. Backend — PHP + Composer
      # ────────────────────────────────────────────
      - name: Installation de PHP 8.3
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, xml, intl, mysql, apcu, opcache, zip
          tools: composer:v2
          coverage: none

      - name: Cache des dépendances Composer
        uses: actions/cache@v4
        with:
          path: backend/vendor
          key: composer-${{ hashFiles('backend/composer.lock') }}
          restore-keys: composer-

      - name: Installation des dépendances backend
        working-directory: backend
        run: |
          composer install --no-dev --no-scripts --prefer-dist --optimize-autoloader
          composer dump-autoload --optimize
          composer dump-env prod

      - name: Warmup du cache Symfony
        working-directory: backend
        run: php bin/console cache:clear --env=prod

      # ────────────────────────────────────────────
      # 3. Frontend — Node.js + Vite build
      # ────────────────────────────────────────────
      - name: Installation de Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build du frontend
        working-directory: frontend
        run: |
          npm ci
          npm run build

      # ────────────────────────────────────────────
      # 4. Déploiement via rsync + SSH
      # ────────────────────────────────────────────
      - name: Configuration de la clé SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -p ${{ secrets.DEPLOY_PORT }} -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts

      - name: Rsync vers le serveur
        run: |
          rsync -e "ssh -i ~/.ssh/deploy_key -p ${{ secrets.DEPLOY_PORT }}" \
            -Cva --delete --stats \
            --exclude '.env.local' \
            --exclude '.env.local.php' \
            --exclude 'backend/.env.local' \
            --exclude 'backend/.env.local.php' \
            --exclude '.git' \
            --exclude '.github' \
            --exclude '.ddev' \
            --exclude 'backend/var/cache' \
            --exclude 'backend/var/log' \
            --exclude 'backend/tests' \
            --exclude 'frontend/node_modules' \
            --exclude 'frontend/src' \
            --exclude 'frontend/__tests__' \
            --exclude 'docs/plans' \
            --exclude 'CLAUDE.md' \
            . ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:${{ secrets.DEPLOY_PATH }}

      - name: Post-deploy sur le serveur
        run: |
          ssh -i ~/.ssh/deploy_key -p ${{ secrets.DEPLOY_PORT }} \
            ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'ENDSSH'
          set -ex

          cd /var/www/tarot/backend

          echo "=== Migrations Doctrine ==="
          php8.3 bin/console doctrine:migrations:migrate \
            --allow-no-migration --all-or-nothing -n -v

          echo "=== Installation des assets ==="
          php8.3 bin/console assets:install --symlink

          echo "=== Nettoyage et warmup du cache ==="
          php8.3 bin/console cache:clear --no-debug --no-warmup
          php8.3 bin/console cache:warmup

          echo "=== Redémarrage PHP-FPM ==="
          sudo systemctl restart php8.3-fpm

          echo "=== Déploiement terminé ==="
          ENDSSH

      # ────────────────────────────────────────────
      # 5. Nettoyage
      # ────────────────────────────────────────────
      - name: Nettoyage de la clé SSH
        if: always()
        run: rm -f ~/.ssh/deploy_key
```

### Explications des choix

| Élément | Pourquoi |
|---------|----------|
| `actions/checkout@v4` | Clone le dépôt dans le runner |
| `shivammathur/setup-php@v2` | Installe PHP 8.3 avec les extensions requises. Sur Jenkins ces extensions sont pré-installées, ici il faut les déclarer. |
| `actions/cache@v4` | Met en cache `vendor/` et `node_modules/` entre les runs pour accélérer les builds suivants. Le cache est invalidé quand le lockfile change. |
| `actions/setup-node@v4` | Installe Node.js 20 avec cache npm intégrée |
| `concurrency.cancel-in-progress: false` | Ne pas interrompre un déploiement en cours si un nouveau push arrive. Le nouveau build attend. |
| `if: always()` sur le nettoyage SSH | S'exécute même si une étape précédente échoue |
| `ssh-keyscan` | Ajoute l'empreinte du serveur aux hôtes connus pour éviter le prompt interactif "Are you sure you want to continue connecting?" |

---

## 4. Workflow optionnel — Déploiement beta

Fichier `.github/workflows/deploy-beta.yml` :

```yaml
name: Déploiement beta

on:
  push:
    branches: [develop]

concurrency:
  group: deploy-beta
  cancel-in-progress: true   # OK d'annuler un déploiement beta en cours

jobs:
  deploy:
    name: Build & Deploy Beta
    runs-on: ubuntu-latest
    environment: beta

    steps:
      - name: Checkout du code
        uses: actions/checkout@v4

      - name: Installation de PHP 8.3
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          extensions: mbstring, xml, intl, mysql, apcu, opcache, zip
          tools: composer:v2
          coverage: none

      - name: Cache des dépendances Composer
        uses: actions/cache@v4
        with:
          path: backend/vendor
          key: composer-${{ hashFiles('backend/composer.lock') }}
          restore-keys: composer-

      - name: Installation des dépendances backend
        working-directory: backend
        run: |
          composer install --no-dev --no-scripts --prefer-dist --optimize-autoloader
          composer dump-autoload --optimize
          composer dump-env beta

      - name: Warmup du cache Symfony
        working-directory: backend
        run: php bin/console cache:clear --env=beta

      - name: Installation de Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build du frontend
        working-directory: frontend
        run: |
          npm ci
          npm run build

      - name: Configuration de la clé SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -p ${{ secrets.DEPLOY_PORT }} -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts

      - name: Rsync vers le serveur beta
        run: |
          rsync -e "ssh -i ~/.ssh/deploy_key -p ${{ secrets.DEPLOY_PORT }}" \
            -Cva --delete --stats \
            --exclude '.env.local' \
            --exclude '.env.local.php' \
            --exclude 'backend/.env.local' \
            --exclude 'backend/.env.local.php' \
            --exclude '.git' \
            --exclude '.github' \
            --exclude '.ddev' \
            --exclude 'backend/var/cache' \
            --exclude 'backend/var/log' \
            --exclude 'backend/tests' \
            --exclude 'frontend/node_modules' \
            --exclude 'frontend/src' \
            --exclude 'frontend/__tests__' \
            --exclude 'docs/plans' \
            --exclude 'CLAUDE.md' \
            . ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:${{ secrets.DEPLOY_PATH }}

      - name: Post-deploy sur le serveur beta
        run: |
          ssh -i ~/.ssh/deploy_key -p ${{ secrets.DEPLOY_PORT }} \
            ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'ENDSSH'
          set -ex

          cd ${{ secrets.DEPLOY_PATH }}/backend

          echo "=== Migrations Doctrine ==="
          php8.3 bin/console doctrine:migrations:migrate \
            --allow-no-migration --all-or-nothing -n -v

          echo "=== Fixtures Doctrine ==="
          php8.3 bin/console doctrine:fixtures:load -n --append

          echo "=== Installation des assets ==="
          php8.3 bin/console assets:install --symlink

          echo "=== Nettoyage et warmup du cache ==="
          php8.3 bin/console cache:clear --no-debug --no-warmup
          php8.3 bin/console cache:warmup

          echo "=== Redémarrage PHP-FPM ==="
          sudo systemctl restart php8.3-fpm

          echo "=== Déploiement beta terminé ==="
          ENDSSH

      - name: Nettoyage de la clé SSH
        if: always()
        run: rm -f ~/.ssh/deploy_key
```

### Différences par rapport à la production

| Aspect | Production | Beta |
|--------|-----------|------|
| **Branche** | `main` | `develop` |
| **Environnement** | `production` | `beta` |
| **`cancel-in-progress`** | `false` (jamais interrompre) | `true` (OK d'annuler) |
| **`dump-env`** | `prod` | `beta` |
| **Fixtures** | Non | Oui (`doctrine:fixtures:load --append`) |
| **Secrets** | Ceux de l'environnement `production` | Ceux de l'environnement `beta` |

---

## 5. Configuration du serveur cible

Identique à la configuration Jenkins (voir [deployment-jenkins.md](./deployment-jenkins.md#4-configuration-du-serveur-cible)), avec l'adaptation suivante pour le nom d'utilisateur :

```bash
# Créer l'utilisateur (ou réutiliser deploy / jenkins-siqual)
sudo adduser deploy --disabled-password
sudo usermod -aG www-data deploy

# Sudo sans mot de passe pour PHP-FPM restart
echo 'deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart php8.3-fpm' \
  | sudo tee /etc/sudoers.d/deploy
```

### Générer la clé SSH dédiée

Il est recommandé de créer une clé SSH **dédiée** aux GitHub Actions (pas réutiliser une clé personnelle) :

```bash
# Sur votre machine locale (pas sur le serveur)
ssh-keygen -t ed25519 -C "github-actions-tarot" -f ~/.ssh/github_actions_tarot

# Afficher la clé privée (à copier dans le secret DEPLOY_SSH_KEY)
cat ~/.ssh/github_actions_tarot

# Copier la clé publique sur le serveur cible
ssh-copy-id -i ~/.ssh/github_actions_tarot.pub deploy@123.45.67.89
```

---

## 6. Gestion et suivi depuis l'interface GitHub

### Voir les déploiements

1. Aller sur **github.com/Soviann/tarot**
2. Onglet **Actions** (en haut, entre Pull requests et Projects)
3. La liste de tous les workflows exécutés apparaît, avec leur statut :
   - ✅ Vert : succès
   - ❌ Rouge : échec
   - 🟡 Jaune : en cours
   - ⏸️ Gris : en attente d'approbation

### Consulter les logs d'un run

1. Dans l'onglet **Actions**, cliquer sur un run
2. Cliquer sur le job **Build & Deploy**
3. Chaque étape est repliable — cliquer pour voir les logs détaillés
4. Les secrets apparaissent comme `***` dans les logs

### Re-lancer un déploiement

1. Dans l'onglet **Actions**, ouvrir le run souhaité
2. Cliquer sur **Re-run all jobs** (en haut à droite)
3. Ou **Re-run failed jobs** pour ne relancer que les étapes échouées

### Déclenchement manuel (workflow_dispatch)

Pour ajouter un bouton de déploiement manuel, modifier le trigger du workflow :

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:       # Ajouter cette ligne
    inputs:
      reason:
        description: 'Raison du déploiement manuel'
        required: false
```

Ensuite dans l'interface :

1. Onglet **Actions** → sélectionner le workflow dans la colonne de gauche
2. Cliquer sur **Run workflow** (bouton qui apparaît en haut à droite)
3. Sélectionner la branche et remplir les inputs éventuels
4. Cliquer sur **Run workflow**

### Badges de statut

Pour afficher le statut du déploiement dans le README :

```markdown
![Déploiement](https://github.com/Soviann/tarot/actions/workflows/deploy-prod.yml/badge.svg)
```

Le badge est accessible depuis : **Actions** → sélectionner le workflow → bouton **…** (trois points) → **Create status badge**.

### Notifications d'échec

Par défaut, GitHub envoie un email à l'auteur du push en cas d'échec. Pour personnaliser :

1. **Settings** (profil personnel) → **Notifications** → **Actions**
2. Choisir entre : email, web, ou les deux

---

## 7. Fonctionnalités avancées

### Cache Composer + npm

Le workflow utilise `actions/cache` pour Composer et le cache npm intégré de `setup-node`. Cela évite de télécharger toutes les dépendances à chaque run.

Temps de build typiques :
- **Premier run** (sans cache) : ~3-4 minutes
- **Runs suivants** (avec cache) : ~1-2 minutes

### Protection de la branche main

Pour empêcher les push directs et forcer les PR :

1. **Settings** → **Branches** → **Add branch protection rule**
2. **Branch name pattern** : `main`
3. Cocher :
   - **Require a pull request before merging**
   - **Require status checks to pass before merging** (si un workflow CI existe)
   - **Do not allow bypassing the above settings**

### Séparer CI et CD

Si le projet a aussi des tests (CI), on peut conditionner le déploiement à la réussite des tests :

```yaml
jobs:
  test:
    name: Tests
    runs-on: ubuntu-latest
    steps:
      # ... étapes de tests ...

  deploy:
    name: Deploy
    needs: test              # Attend que les tests passent
    runs-on: ubuntu-latest
    steps:
      # ... étapes de déploiement ...
```

### Notification Slack/Discord

Ajouter une étape en fin de workflow :

```yaml
      - name: Notification Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Dépannage

### « Permission denied (publickey) »

La clé SSH n'est pas acceptée par le serveur :

- Vérifier que le contenu complet de la clé privée est dans le secret `DEPLOY_SSH_KEY` (y compris `-----BEGIN/END-----`)
- Vérifier que la clé **publique** correspondante est dans `~deploy/.ssh/authorized_keys` sur le serveur
- Tester la connexion manuellement : `ssh -i ~/.ssh/github_actions_tarot deploy@IP`

### « Host key verification failed »

L'étape `ssh-keyscan` a échoué ou le port SSH est incorrect :

- Vérifier que `DEPLOY_PORT` correspond au port SSH réel du serveur
- Vérifier que le serveur est accessible depuis Internet (pas seulement depuis un réseau interne)

> **Limitation** : si le serveur cible n'est **pas** accessible depuis Internet (réseau interne seulement), GitHub Actions ne pourra pas s'y connecter. Utiliser Jenkins dans ce cas, ou mettre en place un tunnel/VPN.

### « rsync: connection unexpectedly closed »

- Le serveur a coupé la connexion (timeout, pare-feu)
- Vérifier que le pare-feu autorise les connexions depuis les [plages IP de GitHub Actions](https://api.github.com/meta) (champ `actions`)
- Solution alternative : autoriser toutes les IPs sur le port SSH et utiliser `fail2ban`

### Le workflow n'apparaît pas dans l'onglet Actions

- Le fichier YAML doit être dans `.github/workflows/` (chemin exact)
- Le YAML doit être syntaxiquement valide — vérifier avec `yamllint` ou dans l'éditeur GitHub
- Le workflow doit être sur la branche par défaut (`main`) pour apparaître initialement

### Les secrets ne sont pas injectés

- Les secrets ne sont **pas** transmis aux workflows déclenchés par des forks (sécurité)
- Vérifier que les noms des secrets correspondent exactement (sensible à la casse)
- Si des **environnements** sont utilisés, vérifier que le job référence le bon environnement (`environment: production`)

### Le build est lent

- Vérifier que le cache fonctionne : dans les logs, l'étape cache doit afficher `Cache restored` (pas `Cache not found`)
- Si `npm ci` est lent, c'est souvent le premier run (pas de cache) — les suivants seront plus rapides
- Les runners GitHub partagés peuvent parfois être lents aux heures de pointe

---

## Récapitulatif

### Fichiers à créer dans le dépôt

| Fichier | Description |
|---------|-------------|
| `.github/workflows/deploy-prod.yml` | Workflow de déploiement production |
| `.github/workflows/deploy-beta.yml` | Workflow de déploiement beta (optionnel) |

### Secrets à configurer sur GitHub

| Secret | Exemple | Où |
|--------|---------|-----|
| `DEPLOY_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Settings → Secrets → Actions |
| `DEPLOY_HOST` | `123.45.67.89` | Settings → Secrets → Actions |
| `DEPLOY_USER` | `deploy` | Settings → Secrets → Actions |
| `DEPLOY_PATH` | `/var/www/tarot` | Settings → Secrets → Actions |
| `DEPLOY_PORT` | `22` | Settings → Secrets → Actions |

### Checklist de mise en place

- [ ] Générer une clé SSH dédiée et l'ajouter au serveur cible
- [ ] Configurer les 5 secrets dans GitHub
- [ ] (Optionnel) Créer les environnements `production` et `beta`
- [ ] Créer le fichier `.github/workflows/deploy-prod.yml`
- [ ] Pusher sur `main` et vérifier le premier déploiement dans l'onglet Actions
- [ ] Vérifier que le site fonctionne après déploiement
