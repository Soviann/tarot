# Déploiement via Jenkins

Guide pour mettre en place un déploiement automatisé de l'application Tarot via Jenkins, basé sur le pattern utilisé chez Siqual (job FFSLC).

## Table des matières

- [Architecture du déploiement](#architecture-du-déploiement)
- [Prérequis](#prérequis)
- [1. Configuration pas à pas depuis l'interface web](#1-configuration-pas-à-pas-depuis-linterface-web)
- [2. Script de build](#2-script-de-build)
- [3. Fichier d'exclusion rsync](#3-fichier-dexclusion-rsync)
- [4. Configuration du serveur cible](#4-configuration-du-serveur-cible)
- [5. Variantes par environnement](#5-variantes-par-environnement)
- [6. Configuration XML (import direct)](#6-configuration-xml-import-direct)
- [Dépannage](#dépannage)

---

## Architecture du déploiement

```
┌────────────┐     git push     ┌──────────────┐    rsync/SSH    ┌──────────────┐
│  GitHub     │ ───────────────▶ │   Jenkins     │ ─────────────▶ │  Serveur     │
│  (Soviann/  │   webhook        │  (build +     │   fichiers     │  cible       │
│   tarot)    │                  │   compile)    │   compilés     │  (VPS OVH)   │
└────────────┘                   └──────────────┘                 └──────────────┘
                                   │                                │
                                   ├─ composer install              ├─ migrations
                                   ├─ npm ci + build                ├─ cache:clear
                                   └─ dump-env                      └─ cache:warmup
```

**Principe** : Jenkins fait le build complet (dépendances PHP, build frontend), puis envoie les fichiers compilés au serveur via rsync. Le serveur n'a besoin ni de Composer ni de Node.js — il ne fait que les opérations post-deploy (migrations, cache).

---

## Prérequis

### Sur Jenkins

- **PHP 8.3** : disponible via `php8.3` (installé sur le serveur Jenkins)
- **Composer 2** : typiquement dans `${JENKINS_HOME}/bin/composer2.phar`
- **Node.js 20+** et **npm** : pour le build frontend
- **Plugins Jenkins** :
  - **Git** : clone du dépôt
  - **GitHub Integration** : webhook push triggers
  - **Workspace Cleanup** : nettoyage post-build
  - (Optionnel) **Mattermost Notification** : alertes dans un canal
  - (Optionnel) **Naginator** : retry automatique en cas d'échec transitoire

### Sur le serveur cible

- **PHP 8.3 CLI** : pour `bin/console`
- **MariaDB** : base de données configurée (voir [deployment.md](./deployment.md))
- **Utilisateur SSH** : `jenkins-siqual` (ou similaire) avec accès en écriture au répertoire de déploiement
- **Clé SSH** : la clé publique du serveur Jenkins doit être dans `~jenkins-siqual/.ssh/authorized_keys`

### Sur GitHub

- **Webhook** : configuré pour notifier Jenkins à chaque push
- **Deploy key** ou **credentials** : pour que Jenkins puisse cloner le dépôt

### Installation des plugins (si manquants)

1. Aller dans **Tableau de bord** → **Administrer Jenkins** → **Gestion des plugins**
2. Onglet **Disponibles**, rechercher et installer :
   - `Git plugin`
   - `GitHub Integration Plugin`
   - `Workspace Cleanup Plugin`
   - `Mattermost Notification Plugin` (optionnel)
   - `Naginator Plugin` (optionnel)
3. Redémarrer Jenkins si demandé

---

## 1. Configuration pas à pas depuis l'interface web

### Étape 1 — Créer le job

1. Depuis le **Tableau de bord Jenkins**, cliquer sur **+ Nouvel Item** (colonne de gauche)
2. Saisir le nom : `BETA - Tarot` (ou `PROD - Tarot`)
3. Sélectionner **Projet free-style**
4. Cliquer sur **OK**

> On arrive sur la page de configuration du job, divisée en sections. Chaque section ci-dessous correspond à un onglet/bloc de cette page.

### Étape 2 — Général

Dans la section **Général** (tout en haut) :

1. **Description** : `Déploiement automatique de l'application Tarot`
2. Cocher **Projet GitHub** → saisir l'URL : `https://github.com/Soviann/tarot/`
3. Cocher **Supprimer les anciens builds** :
   - **Nombre de jours de conservation des builds** : `1`
   - **Nombre maximum de builds à conserver** : `5`
4. Laisser **Exécution concurrente** décoché

### Étape 3 — Gestion du code source

Dans la section **Gestion du code source** :

1. Sélectionner **Git**
2. **Repository URL** : `git@github.com:Soviann/tarot.git`
3. **Credentials** : cliquer sur **Ajouter** → **Jenkins** si aucune clé n'existe :
   - **Type** : `SSH Username with private key`
   - **ID** : `github-soviann-tarot`
   - **Username** : `git`
   - **Private Key** → **Enter directly** : coller la clé privée SSH du serveur Jenkins
   - Cliquer sur **Ajouter**, puis sélectionner le credential dans la liste déroulante
4. **Branches to build** → **Branch Specifier** : `*/main` (prod) ou `*/develop` (beta)
5. Cliquer sur **Avancé…** :
   - **Name** : `origin`
   - **Checkout retry count** : `3`

### Étape 4 — Ce qui déclenche le build

Dans la section **Ce qui déclenche le build** (Build Triggers) :

1. Cocher **GitHub hook trigger for GITScm polling**
2. Tous les autres triggers restent décochés

> Ce trigger nécessite un webhook côté GitHub (voir l'étape 8 ci-dessous).

### Étape 5 — Build

Dans la section **Build** :

1. Cliquer sur **Ajouter une étape au build** → **Exécuter un script shell**
2. Coller le script complet de la [section 2. Script de build](#2-script-de-build)

### Étape 6 — Actions à la suite du build

Dans la section **Actions à la suite du build** (Post-build Actions) :

**a) Workspace Cleanup** (recommandé) :

1. Cliquer sur **Ajouter une action après le build** → **Delete workspace when build is done**
2. Laisser les options par défaut (nettoie après succès et échec)

**b) Mattermost Notification** (optionnel) :

1. Cliquer sur **Ajouter une action après le build** → **Mattermost Notifications**
2. **Endpoint** : URL du webhook Mattermost entrant
3. **Channel** : `tarot-jenkins`
4. Cocher : **Notify Start**, **Notify Success**, **Notify Failure**
5. **Commit info** : `AUTHORS_AND_TITLES`

**c) Naginator — Retry** (optionnel) :

1. Cliquer sur **Ajouter une action après le build** → **Retry build after failure**
2. **Max number of retries** : `2`
3. **Delay** : `Fixed` → `10` secondes

### Étape 7 — Sauvegarder

Cliquer sur **Sauvegarder** en bas de page. Le job est créé.

### Étape 8 — Configurer le webhook GitHub

Pour que GitHub notifie Jenkins à chaque push :

1. Aller sur **GitHub** → **Soviann/tarot** → **Settings** → **Webhooks**
2. Cliquer sur **Add webhook**
3. Remplir :
   - **Payload URL** : `https://jenkins.siqual.fr/github-webhook/`
   - **Content type** : `application/json`
   - **Secret** : (laisser vide ou mettre un secret partagé si configuré dans Jenkins)
   - **Which events?** : sélectionner **Just the push event**
4. Cocher **Active**
5. Cliquer sur **Add webhook**
6. GitHub affiche un ✓ vert si la connexion avec Jenkins fonctionne

### Étape 9 — Tester

1. Retourner dans Jenkins, sur le job `BETA - Tarot`
2. Cliquer sur **Lancer un build** (icône ▶ dans le menu de gauche) pour vérifier manuellement
3. Suivre les logs dans **Console Output** pour s'assurer que chaque étape passe
4. Pour le test automatique : faire un push sur la branche configurée et vérifier que Jenkins se déclenche

---

## 2. Script de build

C'est le cœur du job. Script à coller dans l'étape **Exécuter un script shell** :

```bash
#!/bin/bash
set -ex

# ══════════════════════════════════════════════════════════════
# Variables — adapter selon l'environnement
# ══════════════════════════════════════════════════════════════
DEPLOY_USER="jenkins-siqual"
DEPLOY_HOST="10.0.3.70"           # IP du serveur cible
DEPLOY_PORT="22"
DEPLOY_PATH="/var/www/tarot"      # Répertoire sur le serveur cible
SYMFONY_ENV="prod"                # "prod" ou "beta"

# ══════════════════════════════════════════════════════════════
# 1. Backend — Dépendances PHP
# ══════════════════════════════════════════════════════════════
echo "=== [1/5] Installation des dépendances backend ==="
cd "${WORKSPACE}/backend"

php8.3 ${JENKINS_HOME}/bin/composer2.phar install \
  --no-dev \
  --no-scripts \
  --prefer-dist \
  --optimize-autoloader \
  -v

php8.3 ${JENKINS_HOME}/bin/composer2.phar dump-autoload --optimize
php8.3 ${JENKINS_HOME}/bin/composer2.phar dump-env ${SYMFONY_ENV}

echo "=== [2/5] Cache Symfony (local) ==="
php8.3 bin/console cache:clear --env=${SYMFONY_ENV}

# ══════════════════════════════════════════════════════════════
# 2. Frontend — Build React/Vite
# ══════════════════════════════════════════════════════════════
echo "=== [3/5] Build du frontend ==="
cd "${WORKSPACE}/frontend"

npm ci
npm run build

# ══════════════════════════════════════════════════════════════
# 3. Rsync — Transfert des fichiers vers le serveur
# ══════════════════════════════════════════════════════════════
echo "=== [4/5] Rsync vers le serveur ==="
cd "${WORKSPACE}"

rsync -e "ssh -p${DEPLOY_PORT}" \
  -Cva --delete --stats \
  --exclude-from "config/rsync_exclude.txt" \
  . ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH} \
  --progress

# ══════════════════════════════════════════════════════════════
# 4. Post-deploy — Migrations et cache sur le serveur
# ══════════════════════════════════════════════════════════════
echo "=== [5/5] Post-deploy sur le serveur ==="

ssh ${DEPLOY_USER}@${DEPLOY_HOST} -p ${DEPLOY_PORT} << 'ENDSSH'
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
```

### Explications étape par étape

| Étape | Où | Description |
|-------|----|-------------|
| **1. Composer install** | Jenkins | Installe les dépendances PHP sans les packages de dev (`--no-dev`). `--no-scripts` évite d'exécuter les scripts post-install (pas de DB sur Jenkins). |
| **2. Cache Symfony** | Jenkins | Compile le conteneur Symfony et le cache de routes/serialization côté Jenkins. |
| **3. Build frontend** | Jenkins | `npm ci` (install propre) + `npm run build` génère les fichiers statiques dans `frontend/dist/`. |
| **4. Rsync** | Jenkins → Serveur | Transfert incrémental des fichiers. `--delete` supprime les fichiers obsolètes. `--exclude-from` exclut les fichiers inutiles. |
| **5. Post-deploy** | Serveur | Migrations DB, assets Symfony, cache warmup, restart PHP-FPM. |

> **`composer dump-env`** : compile les variables d'environnement dans `.env.local.php` pour éviter de parser les fichiers `.env` à chaque requête en production. Le fichier `.env.local` doit exister **sur le serveur** avec les vrais secrets (DB password, APP_SECRET) — il sera préservé par rsync grâce au fichier d'exclusion.

---

## 3. Fichier d'exclusion rsync

Créer `config/rsync_exclude.txt` à la racine du dépôt :

```
# Fichiers de configuration locale (secrets)
.env.local
.env.local.php
backend/.env.local
backend/.env.local.php

# Git
.git
.gitignore
.gitattributes

# Environnement de développement
.ddev/
docker-compose*.yml
Dockerfile*

# Dépendances dev / IDE
.idea/
.vscode/
*.swp
*.swo
*~

# Logs et cache (seront régénérés)
backend/var/cache/
backend/var/log/

# Frontend sources (seul dist/ est nécessaire)
frontend/node_modules/
frontend/src/
frontend/public/
frontend/*.config.*
frontend/tsconfig*
frontend/package-lock.json
frontend/index.html

# Tests
backend/tests/
frontend/__tests__/
frontend/test-setup.ts

# Documentation dev
docs/plans/
CLAUDE.md
CHANGELOG.md

# Fichiers CI
config/rsync_exclude.txt
Jenkinsfile
.github/
```

> **Important** : `backend/.env.local` et `backend/.env.local.php` sont exclus pour ne pas écraser les secrets de production à chaque déploiement. Ces fichiers doivent être créés manuellement sur le serveur lors de la première mise en place.

---

## 4. Configuration du serveur cible

### Utilisateur Jenkins

```bash
# Sur le serveur cible, créer l'utilisateur (si pas déjà fait)
sudo adduser jenkins-siqual --disabled-password

# Ajouter aux groupes nécessaires
sudo usermod -aG www-data jenkins-siqual

# Sudo sans mot de passe pour PHP-FPM restart
echo 'jenkins-siqual ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart php8.3-fpm' \
  | sudo tee /etc/sudoers.d/jenkins-siqual
```

### Clé SSH

```bash
# Sur le serveur Jenkins, générer une clé (si pas déjà fait)
ssh-keygen -t ed25519 -C "jenkins@siqual.fr"

# Copier la clé publique sur le serveur cible
ssh-copy-id -i ~/.ssh/id_ed25519.pub jenkins-siqual@10.0.3.70
```

### Répertoire de déploiement

```bash
# Sur le serveur cible
sudo mkdir -p /var/www/tarot
sudo chown jenkins-siqual:www-data /var/www/tarot

# Créer les fichiers d'environnement
cat > /var/www/tarot/backend/.env.local << 'EOF'
APP_ENV=prod
APP_SECRET=GENEREZ_UNE_CLE_SECRETE
DATABASE_URL="mysql://tarot:MOT_DE_PASSE@127.0.0.1:3306/tarot?serverVersion=10.11.2-MariaDB&charset=utf8mb4"
CORS_ALLOW_ORIGIN='^https://tarot\.votre-domaine\.fr$'
EOF

chmod 640 /var/www/tarot/backend/.env.local
```

### Permissions

```bash
# Après le premier déploiement, s'assurer que Symfony peut écrire
chmod -R 775 /var/www/tarot/backend/var
chown -R jenkins-siqual:www-data /var/www/tarot/backend/var
```

---

## 5. Variantes par environnement

### Job BETA vs PROD

| Paramètre | BETA | PROD |
|-----------|------|------|
| **Nom du job** | `BETA - Tarot` | `PROD - Tarot` |
| **Branche** | `*/develop` | `*/main` |
| **SYMFONY_ENV** | `beta` | `prod` |
| **DEPLOY_PATH** | `/var/www/beta-tarot` | `/var/www/tarot` |
| **Fixtures** | Oui (avec `--append`) | Non |
| **Trigger** | Push automatique | Manuel ou tag |

Pour l'environnement beta, ajouter les fixtures après les migrations dans le script post-deploy :

```bash
echo "=== Fixtures Doctrine ==="
php8.3 bin/console doctrine:fixtures:load -n --append
```

### Build déclenché par tag (production)

Pour un déploiement production basé sur les tags :

1. **Branch Specifier** : `*/tags/*` ou un pattern comme `*/v*`
2. Ou déclenchement **manuel** via l'interface Jenkins (pas de trigger automatique)

### Dupliquer un job existant

Pour créer le job PROD à partir du job BETA :

1. **Tableau de bord** → **+ Nouvel Item**
2. Saisir le nom : `PROD - Tarot`
3. En bas du formulaire, dans **Copier depuis** : saisir `BETA - Tarot`
4. Cliquer sur **OK**
5. Modifier la branche (`*/main`), les variables du script (`SYMFONY_ENV`, `DEPLOY_PATH`), et retirer les fixtures
6. **Sauvegarder**

---

## 6. Configuration XML (import direct)

Pour référence, voici la structure XML du job (importable via **Administrer Jenkins** → **Jenkins CLI** ou en copiant dans `$JENKINS_HOME/jobs/BETA - Tarot/config.xml`) :

```xml
<?xml version='1.1' encoding='UTF-8'?>
<project>
  <description>Déploiement automatique de l'application Tarot</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <jenkins.model.BuildDiscarderProperty>
      <strategy class="hudson.tasks.LogRotator">
        <daysToKeep>1</daysToKeep>
        <numToKeep>5</numToKeep>
        <artifactDaysToKeep>-1</artifactDaysToKeep>
        <artifactNumToKeep>-1</artifactNumToKeep>
      </strategy>
    </jenkins.model.BuildDiscarderProperty>
    <com.coravy.hudson.plugins.github.GithubProjectProperty>
      <projectUrl>https://github.com/Soviann/tarot/</projectUrl>
    </com.coravy.hudson.plugins.github.GithubProjectProperty>
  </properties>
  <scm class="hudson.plugins.git.GitSCM">
    <userRemoteConfigs>
      <hudson.plugins.git.UserRemoteConfig>
        <url>git@github.com:Soviann/tarot.git</url>
      </hudson.plugins.git.UserRemoteConfig>
    </userRemoteConfigs>
    <branches>
      <hudson.plugins.git.BranchSpec>
        <name>*/main</name>
      </hudson.plugins.git.BranchSpec>
    </branches>
  </scm>
  <scmCheckoutRetryCount>3</scmCheckoutRetryCount>
  <canRoam>true</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <triggers>
    <com.cloudbees.jenkins.GitHubPushTrigger>
      <spec></spec>
    </com.cloudbees.jenkins.GitHubPushTrigger>
  </triggers>
  <concurrentBuild>false</concurrentBuild>
  <builders>
    <hudson.tasks.Shell>
      <command><!-- Coller le script de build de la section 2 --></command>
    </hudson.tasks.Shell>
  </builders>
  <publishers>
    <hudson.plugins.ws__cleanup.WsCleanup>
      <deleteDirs>false</deleteDirs>
      <skipWhenFailed>false</skipWhenFailed>
      <cleanWhenSuccess>true</cleanWhenSuccess>
      <cleanWhenFailure>true</cleanWhenFailure>
    </hudson.plugins.ws__cleanup.WsCleanup>
  </publishers>
</project>
```

---

## Comparaison avec le déploiement manuel

| Aspect | Jenkins | Script `deploy.sh` |
|--------|---------|---------------------|
| **Déclenchement** | Automatique (push) | Manuel (SSH + exécution) |
| **Build** | Sur Jenkins (isolé) | Sur le serveur cible |
| **Node.js sur le serveur** | Non requis | Requis |
| **Composer sur le serveur** | Non requis | Requis |
| **Rollback** | Relancer un build précédent | `git checkout` + redéployer |
| **Notifications** | Mattermost intégré | Aucune |
| **Historique** | Logs de build conservés | Aucun |

---

## Dépannage

### Le build échoue à l'étape Composer

```
Could not find package...
```

Vérifier que Composer est à jour :
```bash
php8.3 ${JENKINS_HOME}/bin/composer2.phar self-update
```

### Rsync timeout ou connexion refusée

```
ssh: connect to host 10.0.3.70 port 22: Connection refused
```

- Vérifier que le serveur cible est accessible depuis Jenkins
- Vérifier que la clé SSH est correctement configurée
- Tester manuellement : `ssh jenkins-siqual@10.0.3.70 echo "OK"`

### Les migrations échouent sur le serveur

```
Migration XXXXX failed
```

- Se connecter en SSH et lancer manuellement :
  ```bash
  cd /var/www/tarot/backend
  php8.3 bin/console doctrine:migrations:status
  php8.3 bin/console doctrine:migrations:migrate -n -v
  ```
- Vérifier que `DATABASE_URL` dans `.env.local` est correct

### Le frontend ne s'affiche pas après le déploiement

- Vérifier que `frontend/dist/` contient les fichiers buildés
- Vérifier que le rsync n'exclut pas `frontend/dist/`
- Vérifier la configuration Nginx (voir [deployment.md](./deployment.md#6-configuration-de-nginx))

### Permission denied sur le cache Symfony

```
Unable to create the "var/cache/prod" directory
```

```bash
sudo chown -R jenkins-siqual:www-data /var/www/tarot/backend/var
sudo chmod -R 775 /var/www/tarot/backend/var
```
