# Guide de déploiement — VPS OVH

Guide complet pour héberger l'application Tarot sur un VPS OVH avec Debian, Nginx, PHP-FPM et MariaDB.

## Table des matières

- [Architecture de production](#architecture-de-production)
- [Prérequis](#prérequis)
- [1. Préparation du serveur](#1-préparation-du-serveur)
- [2. Installation des dépendances système](#2-installation-des-dépendances-système)
- [3. Configuration de MariaDB](#3-configuration-de-mariadb)
- [4. Configuration de PHP-FPM](#4-configuration-de-php-fpm)
- [5. Déploiement de l'application](#5-déploiement-de-lapplication)
- [6. Configuration de Nginx](#6-configuration-de-nginx)
- [7. HTTPS avec Let's Encrypt](#7-https-avec-lets-encrypt)
- [8. Permissions et sécurité](#8-permissions-et-sécurité)
- [9. Mise à jour de l'application](#9-mise-à-jour-de-lapplication)
- [10. Supervision et maintenance](#10-supervision-et-maintenance)
- [Dépannage](#dépannage)

---

## Architecture de production

```
                    ┌─────────────┐
  Navigateur ─────▶ │   Nginx     │
                    │  (port 443) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
     /api/*  → PHP-FPM          /*  → fichiers statiques
     (Symfony API)               (React build)
              │
              ▼
         MariaDB
```

En production, Nginx sert **deux rôles** :
1. **Fichiers statiques** : le build React (HTML, JS, CSS) servi directement
2. **Proxy PHP** : les requêtes `/api/*` sont transmises à PHP-FPM (Symfony)

Le frontend et le backend partagent le même domaine, ce qui élimine les problèmes de CORS.

---

## Prérequis

- **VPS OVH** : Debian 12 (Bookworm) recommandé — minimum 1 vCPU, 2 Go RAM
- **Nom de domaine** pointant vers l'IP du VPS (enregistrement DNS A)
- **Accès SSH** en root ou avec un utilisateur sudo

---

## 1. Préparation du serveur

### Connexion et mise à jour

```bash
ssh root@VOTRE_IP

# Mise à jour du système
apt update && apt upgrade -y
```

### Créer un utilisateur dédié

```bash
adduser deploy
usermod -aG sudo deploy

# Se reconnecter en tant que deploy
su - deploy
```

### Configurer le pare-feu

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### (Optionnel) Sécuriser SSH

Éditer `/etc/ssh/sshd_config` :

```
PermitRootLogin no
PasswordAuthentication no   # après avoir configuré une clé SSH
```

```bash
sudo systemctl restart sshd
```

---

## 2. Installation des dépendances système

### PHP 8.3

```bash
# Ajouter le dépôt Sury pour PHP 8.3
sudo apt install -y ca-certificates apt-transport-https software-properties-common lsb-release curl
curl -sSLo /tmp/debsuryorg-archive-keyring.deb https://packages.sury.org/debsuryorg-archive-keyring.deb
sudo dpkg -i /tmp/debsuryorg-archive-keyring.deb
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/deb.sury.org-archive-keyring.gpg] https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/sury-php.list'
sudo apt update

# Installer PHP et les extensions requises
sudo apt install -y \
  php8.3-fpm \
  php8.3-cli \
  php8.3-common \
  php8.3-mysql \
  php8.3-xml \
  php8.3-mbstring \
  php8.3-intl \
  php8.3-opcache \
  php8.3-apcu \
  php8.3-curl \
  php8.3-zip \
  unzip
```

### Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### Node.js 20 (pour le build frontend)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### MariaDB

```bash
sudo apt install -y mariadb-server
sudo mysql_secure_installation
```

Pendant `mysql_secure_installation` :
- Définir un mot de passe root
- Supprimer les utilisateurs anonymes : **Oui**
- Désactiver la connexion root à distance : **Oui**
- Supprimer la base de test : **Oui**

### Nginx

```bash
sudo apt install -y nginx
```

### Git

```bash
sudo apt install -y git
```

---

## 3. Configuration de MariaDB

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE tarot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tarot'@'localhost' IDENTIFIED BY 'VOTRE_MOT_DE_PASSE_SECURISE';
GRANT ALL PRIVILEGES ON tarot.* TO 'tarot'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **Important** : remplacez `VOTRE_MOT_DE_PASSE_SECURISE` par un mot de passe fort. Ne réutilisez pas le mot de passe root.

---

## 4. Configuration de PHP-FPM

### Optimiser php.ini

Éditer `/etc/php/8.3/fpm/php.ini` :

```ini
; Performance
memory_limit = 256M
max_execution_time = 30
upload_max_filesize = 10M
post_max_size = 10M

; OPcache (crucial pour Symfony en production)
opcache.enable = 1
opcache.memory_consumption = 256
opcache.max_accelerated_files = 20000
opcache.validate_timestamps = 0
; ⚠️ validate_timestamps = 0 signifie qu'il faut redémarrer PHP-FPM après chaque déploiement

; Sécurité
expose_php = Off
```

### Configurer le pool PHP-FPM

Éditer `/etc/php/8.3/fpm/pool.d/www.conf` :

```ini
[www]
user = deploy
group = deploy
listen = /run/php/php8.3-fpm.sock
listen.owner = www-data
listen.group = www-data

; Ajuster selon la RAM du VPS
pm = dynamic
pm.max_children = 10
pm.start_servers = 3
pm.min_spare_servers = 2
pm.max_spare_servers = 5
```

```bash
sudo systemctl restart php8.3-fpm
```

---

## 5. Déploiement de l'application

### Structure des répertoires

```bash
sudo mkdir -p /var/www/tarot
sudo chown deploy:deploy /var/www/tarot
```

### Cloner le dépôt

```bash
cd /var/www/tarot
git clone git@github.com:Soviann/tarot.git .
```

> **Note** : configurer une clé SSH de déploiement (lecture seule) sur le dépôt GitHub, ou utiliser un token HTTPS.

### Backend (Symfony)

```bash
cd /var/www/tarot/backend

# Installer les dépendances (sans les dev)
composer install --no-dev --optimize-autoloader

# Créer le fichier d'environnement de production
cp .env .env.local
```

Éditer `/var/www/tarot/backend/.env.local` :

```env
APP_ENV=prod
APP_SECRET=GENEREZ_UNE_CLE_SECRETE_DE_32_CARACTERES
DATABASE_URL="mysql://tarot:VOTRE_MOT_DE_PASSE_SECURISE@127.0.0.1:3306/tarot?serverVersion=10.11.2-MariaDB&charset=utf8mb4"
CORS_ALLOW_ORIGIN='^https://VOTRE_DOMAINE\.fr$'
```

> Pour générer `APP_SECRET` : `php -r "echo bin2hex(random_bytes(16));"`

```bash
# Compiler les fichiers .env pour la production (plus rapide que parser à chaque requête)
composer dump-env prod

# Exécuter les migrations
php bin/console doctrine:migrations:migrate --no-interaction

# Vider et réchauffer le cache
php bin/console cache:clear
php bin/console cache:warmup
```

### Frontend (React)

```bash
cd /var/www/tarot/frontend

# Installer les dépendances
npm ci

# Builder pour la production
# VITE_API_URL n'est PAS nécessaire si le frontend est servi depuis le même domaine
# (les requêtes iront vers /api par défaut)
npm run build
```

Le build produit les fichiers dans `frontend/dist/`.

---

## 6. Configuration de Nginx

Créer le fichier de configuration : `/etc/nginx/sites-available/tarot`

```nginx
server {
    listen 80;
    server_name VOTRE_DOMAINE.fr;

    # Redirection HTTP → HTTPS (activé après Certbot, étape 7)
    # return 301 https://$server_name$request_uri;

    # --- Configuration temporaire avant HTTPS ---
    # (sera remplacée par Certbot)

    # Frontend : fichiers statiques React (SPA)
    root /var/www/tarot/frontend/dist;
    index index.html;

    # Logs
    access_log /var/log/nginx/tarot-access.log;
    error_log /var/log/nginx/tarot-error.log;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # ──────────────────────────────────────────────
    # Backend API : requêtes /api/* → PHP-FPM
    # ──────────────────────────────────────────────
    location /api {
        alias /var/www/tarot/backend/public;
        try_files $uri /api/index.php$is_args$args;

        location ~ \.php$ {
            # Résoudre le vrai chemin du script
            fastcgi_pass unix:/run/php/php8.3-fpm.sock;
            fastcgi_split_path_info ^(.+\.php)(/.*)$;
            include fastcgi_params;

            # IMPORTANT : le SCRIPT_FILENAME doit pointer vers le vrai fichier
            fastcgi_param SCRIPT_FILENAME /var/www/tarot/backend/public/index.php;
            fastcgi_param DOCUMENT_ROOT /var/www/tarot/backend/public;

            # Optimisations
            fastcgi_buffer_size 128k;
            fastcgi_buffers 4 256k;
            fastcgi_busy_buffers_size 256k;

            internal;
        }
    }

    # ──────────────────────────────────────────────
    # PWA : Service Worker et manifeste
    # ──────────────────────────────────────────────
    location /sw.js {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }

    location /manifest.webmanifest {
        add_header Content-Type "application/manifest+json";
        try_files $uri =404;
    }

    # ──────────────────────────────────────────────
    # Assets statiques : cache long (fichiers hashés par Vite)
    # ──────────────────────────────────────────────
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ──────────────────────────────────────────────
    # SPA fallback : toutes les autres routes → index.html
    # ──────────────────────────────────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Sécurité : bloquer les fichiers cachés
    location ~ /\. {
        deny all;
    }
}
```

### Activer le site

```bash
sudo ln -s /etc/nginx/sites-available/tarot /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # Supprimer le site par défaut
sudo nginx -t                               # Tester la configuration
sudo systemctl reload nginx
```

> **Configuration Nginx `alias` + `/api`** : cette configuration utilise `alias` pour servir les requêtes `/api/*` depuis le répertoire `backend/public/`. L'ensemble passe par le `index.php` de Symfony. Selon le routage Symfony, les URLs sont de la forme `/api/players`, `/api/sessions`, etc. — elles fonctionnent directement.

---

## 7. HTTPS avec Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d VOTRE_DOMAINE.fr
```

Certbot va :
1. Obtenir un certificat SSL gratuit
2. Modifier automatiquement la config Nginx pour HTTPS
3. Ajouter la redirection HTTP → HTTPS
4. Configurer le renouvellement automatique

Vérifier le renouvellement automatique :

```bash
sudo certbot renew --dry-run
```

---

## 8. Permissions et sécurité

### Permissions des fichiers

```bash
cd /var/www/tarot

# L'utilisateur deploy est propriétaire de tout
chown -R deploy:deploy .

# Backend : Symfony a besoin d'écrire dans var/ (cache, logs)
chmod -R 775 backend/var
```

### Fichiers sensibles

S'assurer que ces fichiers ne sont **jamais** accessibles publiquement :

```bash
# .env.local.php contient les secrets compilés
chmod 640 /var/www/tarot/backend/.env.local.php

# Le répertoire .git ne doit pas être exposé (déjà bloqué par Nginx)
```

---

## 9. Mise à jour de l'application

Script de déploiement à placer dans `/var/www/tarot/deploy.sh` :

```bash
#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/tarot"

echo "=== Déploiement Tarot ==="

cd "$APP_DIR"

# 1. Récupérer les dernières modifications
echo "[1/7] Pull des sources..."
git pull origin main

# 2. Backend
echo "[2/7] Installation des dépendances backend..."
cd "$APP_DIR/backend"
composer install --no-dev --optimize-autoloader

echo "[3/7] Compilation de l'environnement..."
composer dump-env prod

echo "[4/7] Migrations de la base de données..."
php bin/console doctrine:migrations:migrate --no-interaction

echo "[5/7] Nettoyage du cache Symfony..."
php bin/console cache:clear
php bin/console cache:warmup

# 3. Frontend
echo "[6/7] Build du frontend..."
cd "$APP_DIR/frontend"
npm ci
npm run build

# 4. Redémarrer PHP-FPM (nécessaire car opcache.validate_timestamps = 0)
echo "[7/7] Redémarrage de PHP-FPM..."
sudo systemctl restart php8.3-fpm

echo "=== Déploiement terminé ==="
```

```bash
chmod +x /var/www/tarot/deploy.sh
```

Pour déployer :

```bash
/var/www/tarot/deploy.sh
```

> **Sudo sans mot de passe pour PHP-FPM** : pour que le script puisse redémarrer PHP-FPM sans mot de passe, ajouter dans `/etc/sudoers.d/deploy` :
> ```
> deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart php8.3-fpm
> ```

---

## 10. Supervision et maintenance

### Logs

```bash
# Logs Nginx
tail -f /var/log/nginx/tarot-access.log
tail -f /var/log/nginx/tarot-error.log

# Logs Symfony (prod)
tail -f /var/www/tarot/backend/var/log/prod.log

# Logs PHP-FPM
journalctl -u php8.3-fpm -f

# Logs MariaDB
journalctl -u mariadb -f
```

### Sauvegardes de la base de données

Créer un script de sauvegarde `/var/www/tarot/backup-db.sh` :

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/tarot"
DATE=$(date +%Y-%m-%d_%H%M)

mkdir -p "$BACKUP_DIR"
mysqldump -u tarot -pVOTRE_MOT_DE_PASSE_SECURISE tarot > "$BACKUP_DIR/tarot_$DATE.sql"

# Garder les 30 dernières sauvegardes
ls -t "$BACKUP_DIR"/tarot_*.sql | tail -n +31 | xargs -r rm

echo "Sauvegarde créée : $BACKUP_DIR/tarot_$DATE.sql"
```

Automatiser via cron (tous les jours à 3h) :

```bash
crontab -e
# Ajouter :
0 3 * * * /var/www/tarot/backup-db.sh >> /var/log/tarot-backup.log 2>&1
```

### Vérification de santé

```bash
# Tester que l'API répond
curl -s https://VOTRE_DOMAINE.fr/api/players | head -c 200

# Tester que le frontend est servi
curl -s -o /dev/null -w "%{http_code}" https://VOTRE_DOMAINE.fr/
```

### Mises à jour système

```bash
# Mises à jour de sécurité (à faire régulièrement)
sudo apt update && sudo apt upgrade -y

# Renouvellement certificat SSL (automatique, mais vérifiable)
sudo certbot renew --dry-run
```

---

## Dépannage

### « 502 Bad Gateway »

PHP-FPM ne tourne pas ou le socket est incorrect :

```bash
sudo systemctl status php8.3-fpm
sudo systemctl restart php8.3-fpm
ls -la /run/php/php8.3-fpm.sock
```

### « 403 Forbidden » sur le frontend

Problème de permissions :

```bash
# Vérifier que Nginx peut lire les fichiers
namei -l /var/www/tarot/frontend/dist/index.html
```

### « 500 Internal Server Error » sur l'API

Consulter les logs Symfony :

```bash
tail -50 /var/www/tarot/backend/var/log/prod.log
```

Causes fréquentes :
- `APP_SECRET` non défini → vérifier `.env.local.php`
- `DATABASE_URL` incorrect → tester la connexion MySQL
- Cache corrompu → `php bin/console cache:clear`

### Les routes API retournent du HTML (page 404 Nginx)

La configuration `location /api` ne route pas correctement vers PHP-FPM. Vérifier :

```bash
sudo nginx -t
sudo nginx -T | grep -A 20 "location /api"
```

### Le Service Worker (PWA) ne s'installe pas

Le Service Worker nécessite HTTPS. Vérifier :
- Le certificat SSL est valide : `curl -vI https://VOTRE_DOMAINE.fr 2>&1 | grep "SSL certificate"`
- Le fichier `sw.js` est accessible : `curl -I https://VOTRE_DOMAINE.fr/sw.js`
- Le header `Cache-Control: no-cache` est présent sur `sw.js`

### Performances lentes

```bash
# Vérifier qu'OPcache est activé
php -i | grep opcache.enable

# Vérifier que le cache Symfony est réchauffé
ls -la /var/www/tarot/backend/var/cache/prod/

# Vérifier les slow queries MariaDB
sudo mysql -e "SHOW VARIABLES LIKE 'slow_query_log';"
```

---

## Récapitulatif des ports et services

| Service | Port | Usage |
|---------|------|-------|
| Nginx | 80, 443 | HTTP/HTTPS (frontend + API) |
| PHP-FPM | socket Unix | Traitement PHP (API Symfony) |
| MariaDB | 3306 (local) | Base de données (non exposé) |
| SSH | 22 | Administration |

## Récapitulatif des chemins

| Élément | Chemin |
|---------|--------|
| Racine du projet | `/var/www/tarot/` |
| Backend Symfony | `/var/www/tarot/backend/` |
| Frontend build | `/var/www/tarot/frontend/dist/` |
| Config Nginx | `/etc/nginx/sites-available/tarot` |
| Config PHP-FPM | `/etc/php/8.3/fpm/pool.d/www.conf` |
| Logs Nginx | `/var/log/nginx/tarot-*.log` |
| Logs Symfony | `/var/www/tarot/backend/var/log/prod.log` |
| Sauvegardes BDD | `/var/backups/tarot/` |
| Script de déploiement | `/var/www/tarot/deploy.sh` |

## Variables d'environnement de production

| Variable | Fichier | Exemple |
|----------|---------|---------|
| `APP_ENV` | `.env.local` | `prod` |
| `APP_SECRET` | `.env.local` | `a1b2c3...` (32 caractères hex) |
| `DATABASE_URL` | `.env.local` | `mysql://tarot:pass@127.0.0.1:3306/tarot?serverVersion=10.11.2-MariaDB&charset=utf8mb4` |
| `CORS_ALLOW_ORIGIN` | `.env.local` | `^https://tarot\.mondomaine\.fr$` |
