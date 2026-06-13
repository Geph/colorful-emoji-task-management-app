# MySQL Database Setup (Dreamhost VPS)

The app is a static Next.js export. Task data syncs to MySQL through a small PHP API that you host alongside the built site on Dreamhost.

## 1. Create the database

In Dreamhost panel → **MySQL Databases**:

1. Create database: `yourusername_taskapp`
2. Create user: `yourusername_taskapp` with a strong password
3. Grant the user full access to the database
4. Open phpMyAdmin and run `server/php/schema.sql`

### Finding `DB_HOST` (do not use `localhost`)

DreamHost runs MySQL on a **separate database server**. Their docs explicitly say not to use `localhost` or `127.0.0.1` for the hostname.

**Where to find it:**

1. Log in to the [DreamHost panel](https://panel.dreamhost.com/)
2. Go to **Websites → Manage Websites** (or **Goodies → MySQL Databases** on older panel layouts)
3. Open **MySQL Databases**
4. Look at the **HOSTNAME** section near the top — you’ll see one or more hostnames like:
   - `mysql.jeffginger.com`
   - `mysql.example.com` (a subdomain you created for MySQL)

Use that exact hostname as `DB_HOST` in `config.php`.

**If you don’t have a hostname yet:** on the MySQL Databases page, create one (often `mysql.yourdomain.com`). It must resolve via DNS — if `jeffginger.com` uses DreamHost nameservers, this usually works automatically after propagation.

**Quick test from SSH on your VPS:**

```bash
mysql -h mysql.jeffginger.com -u yourusername_taskapp -p yourusername_taskapp
```

If that connects, use the same `-h` value in PHP.

**Alternative hostnames** (if your domain’s mysql subdomain isn’t ready yet): DreamHost also documents data-center phpMyAdmin hostnames (e.g. `west1-phpmyadmin.dreamhost.com` region equivalents). Any mysql hostname on your account can reach any database in that account — see [Finding your database login credentials](https://help.dreamhost.com/hc/en-us/articles/221610868-Finding-your-database-login-credentials).

## 2. Deploy the PHP API

Upload these files to your site:

```
public_html/task/api/data.php
public_html/task/api/config.php   ← copy from config.example.php
```

Set credentials in `config.php`:

```php
const DB_HOST = 'mysql.jeffginger.com';  // from panel → MySQL Databases → HOSTNAME
const DB_NAME = 'yourusername_taskapp';
const DB_USER = 'yourusername_taskapp';
const DB_PASS = 'your-secure-password';
const API_KEY = 'choose-a-long-random-string';
const ALLOWED_ORIGIN = 'https://jeffginger.com';
```

## 3. Configure the frontend

Create `.env.local` for local builds or set environment variables in CI:

```env
NEXT_PUBLIC_BASE_PATH=/task
NEXT_PUBLIC_ASSET_PREFIX=/task/
NEXT_PUBLIC_STORAGE_API=https://jeffginger.com/task/api/data.php
NEXT_PUBLIC_STORAGE_API_KEY=choose-a-long-random-string
```

When `NEXT_PUBLIC_STORAGE_API` is set:

- On load, the app pulls data from MySQL (falls back to browser storage if unavailable)
- Changes are debounced and saved back to MySQL
- The header dot shows connection status (green = connected, blue = local-only, red = error)

PIN codes stay in browser storage only and are **not** synced to MySQL.

## Migrating existing browser data to MySQL

If the site already shows your tasks from an earlier visit (browser memory), use this checklist:

### 1. Confirm the PHP API is reachable

The app auto-detects the storage URL at:

```
https://your-domain.com/task/api/data.php
```

(based on your site URL + `/task` base path). You can override with `NEXT_PUBLIC_STORAGE_API` at build time if needed.

Health check: open `https://jeffginger.com/task/api/data.php?health=1` — should return `{"ok":true,...}`.

Optional `.env.local` overrides:

```env
NEXT_PUBLIC_STORAGE_API=https://jeffginger.com/task/api/data.php
NEXT_PUBLIC_STORAGE_API_KEY=your-api-key
```

Only set `NEXT_PUBLIC_STORAGE_API_KEY` if you also set `API_KEY` in `config.php`.

### 2. Confirm PHP + MySQL are working

- `server/php/data.php` and `config.php` are on the server under `/task/api/`
- `schema.sql` has been run in phpMyAdmin
- Header dot is **green** (not blue or red)

Test in a browser tab: `https://jeffginger.com/task/api/data.php?health=1` should return JSON like `{"ok":true,...}`.

### 3. Push your current browser data

Once the green dot shows and your tasks are visible:

1. Open **Settings → Data**
2. Click **Push to database now**

That uploads everything currently loaded in the browser (including data restored from old `localStorage` keys).

After the first successful push, edits auto-save to MySQL after about a second. You can also trigger another push anytime from Settings.

**Tip:** Make any small edit (rename a task) and wait ~2 seconds — that also triggers an auto-save if sync is configured.

## 4. Deploy static files

```bash
npm install
npm run build
```

Upload the contents of `out/` to `public_html/task/` on Dreamhost.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Red dot on load | Verify `DB_HOST` is your panel hostname (not `localhost`), plus credentials and API URL |
| `Database connection failed` in PHP | Wrong `DB_HOST` — check **MySQL Databases → HOSTNAME** in the DreamHost panel |
| 401 errors | Match `API_KEY` in PHP with `NEXT_PUBLIC_STORAGE_API_KEY` in the frontend |
| CORS errors | Set `ALLOWED_ORIGIN` to your exact site URL |
| Data not persisting | Confirm `app_data` table exists and PHP can write to it |

## GitHub Pages vs Dreamhost

| Target | `NEXT_PUBLIC_BASE_PATH` | Storage |
|--------|-------------------------|---------|
| GitHub Pages | `/colorful-emoji-task-management-app` | Browser storage only |
| Dreamhost `/task/` | `/task` | MySQL via PHP API |
