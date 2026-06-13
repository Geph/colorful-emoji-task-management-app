# Deploying to Dreamhost Shared Hosting

## Build locally

```bash
cp .env.example .env.local
# Edit .env.local for /task/ base path and MySQL API URL
npm install
npm run build
```

Upload the contents of the `out/` folder to `public_html/task/` via FTP or SFTP.

## PHP API for MySQL sync

Upload the PHP files separately (they are not part of the static export):

```
server/php/data.php      → public_html/task/api/data.php
server/php/config.php    → public_html/task/api/config.php  (copy from config.example.php)
```

Run `server/php/schema.sql` in phpMyAdmin. Full instructions are in [DATABASE.md](./DATABASE.md).

## GitHub Pages

GitHub Pages deployment is handled automatically by `.github/workflows/deploy.yml` on pushes to `main`. Enable **Settings → Pages → Source: GitHub Actions**.

## File structure after build

```
out/
  index.html
  _next/
  ...
```

## Notes

- Upload the **contents** of `out/`, not the folder itself
- PIN codes stay in browser storage only
- Without the PHP API, tasks persist in browser storage only
- Clear browser cache after updates if you see stale assets
