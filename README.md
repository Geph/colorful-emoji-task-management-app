# Simple Colorful Emoji Task List App

[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=for-the-badge&logo=github)](https://geph.github.io/v0-task-management-app/)

![Task Management App Screenshot](https://github.com/Geph/v0-task-management-app/blob/main/Example-Screenshot.png)

A self-hosted, emoji-rich task manager built with Next.js. Works as a static site on GitHub Pages or Dreamhost, with optional MySQL sync for persistent storage on your VPS.

---

## Highlights

### Emojis Everywhere
Every task can have its own emoji. The picker includes 650+ emojis across categories (office, people, animals, food, symbols, science, and more), all searchable by keyword.

### Colorful Status and Priority
Color-coded statuses and priorities, fully customizable in Settings.

### Flexible Hosting
- **GitHub Pages** — zero backend, browser storage
- **Dreamhost VPS** — static site + PHP/MySQL API at `/task/`

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` (or `http://localhost:3000/task/` if using the Dreamhost base path).

### Production build

```bash
npm run build
# Static output is in /out
```

---

## Deployment

| Target | Base path env | Storage |
|--------|---------------|---------|
| [GitHub Pages](https://geph.github.io/v0-task-management-app/) | `NEXT_PUBLIC_BASE_PATH=/v0-task-management-app` | Browser `localStorage` |
| [jeffginger.com/task/](https://jeffginger.com/task/) | `NEXT_PUBLIC_BASE_PATH=/task` | MySQL via PHP API |

See [DATABASE.md](./DATABASE.md) for MySQL setup on Dreamhost and [DEPLOYMENT.md](./DEPLOYMENT.md) for upload instructions.

### GitHub Pages CI

Pushes to `main` automatically:
1. Bump the patch version in `package.json`
2. Build the static site
3. Deploy to GitHub Pages

Enable Pages under **Settings → Pages → Source: GitHub Actions**.

---

## Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BASE_PATH` | URL prefix (e.g. `/task` or `/v0-task-management-app`) |
| `NEXT_PUBLIC_ASSET_PREFIX` | Asset prefix matching base path |
| `NEXT_PUBLIC_STORAGE_API` | PHP endpoint URL for MySQL sync |
| `NEXT_PUBLIC_STORAGE_API_KEY` | Shared secret sent as `X-API-Key` |

When storage API vars are unset, the app uses browser storage only.

---

## Tech Stack

- Next.js 14 (static export)
- React 18
- Tailwind CSS 4
- shadcn/ui
- Lucide icons
- Optional: PHP + MySQL on Dreamhost

---

## License

MIT
