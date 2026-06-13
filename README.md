# Simple Colorful Emoji Task List App

[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=for-the-badge&logo=github)](https://geph.github.io/colorful-emoji-task-management-app/)

![Task Management App Screenshot](https://github.com/Geph/colorful-emoji-task-management-app/blob/main/Example-Screenshot.png)

A self-hosted, emoji-rich task manager built with Next.js. Deploy as a static site on GitHub Pages or Dreamhost, with optional MySQL sync for persistent storage on your VPS.

---

## Three Stand-Out Features

### 1. Emojis Everywhere
Every task can have its own emoji for quick visual identification. The app includes an extensive emoji picker with 650+ emojis organized by category — from office essentials (calendars, mail, charts) to people, animals, food, science, and symbols. Emojis are fully searchable by related keywords, so typing "report" finds documents or "hungry" finds food emojis. New tasks even get smart emoji suggestions based on keywords in the task name.

### 2. Colorful Status and Priority System
Tasks are organized with vibrant, color-coded status and priority indicators. Statuses include On-going (blue), Working on it (yellow), Stuck (pink), Waiting/Review (cyan), and more. Priorities range from High (red) to Low (blue) to Someday (teal). All colors are customizable through Settings, so you can build a system that fits your workflow.

### 3. Simple and Intuitive
No complicated setup or learning curve. Tasks live in collapsible sections you can rename, reorder, and manage easily. The interface stays focused on getting things done. It works on desktop and mobile with a responsive layout that adapts to your screen size.

---

## Main Features

### Task Management
- **Sections**: Organize tasks into named sections that can be expanded/collapsed, renamed, reordered (up/down arrows), or deleted
- **Task Details**: Click any task to open a detailed view with notes, status, priority, progress, due date, and assignee
- **Rich Text Notes**: Add formatted notes to tasks with bold, italic, underline, and hyperlinks
- **Task Completion**: Mark tasks complete to move them to a dedicated "Completed" section (collapsible); mark incomplete to restore them to their original section
- **Bulk Actions**: Select multiple tasks to delete, move to another section, merge into one, or mark complete

### Customization
- **Custom App Name & Icon**: Personalize the header with your own app name and logo
- **Header Color**: Pick any color for the app header
- **Column Visibility**: Show or hide columns for status, priority, progress, due date, and assignee
- **Column Ordering**: Drag and drop to reorder columns as you prefer
- **Manage Options**: Add, edit, or remove status and priority options with custom colors
- **Themes**: Light, dark, and system themes
- **PIN Protection**: Optionally set a 4-digit PIN to protect access to your task list
- **Version Indicator**: Current app version shown under Settings → General

### Sorting and Search
- **Column Sorting**: Click column headers to sort by name, status, priority, or due date
- **Search**: Filter tasks across all sections by name or emoji
- **Smart Defaults**: New tasks appear at the top; default sorting prioritizes by priority, then progress, then alphabetically

### Data Management
- **Browser Storage**: All changes are automatically saved locally and persist across page reloads
- **MySQL Sync (optional)**: Push tasks to a Dreamhost MySQL database via a lightweight PHP API — use **Settings → Data → Push to database now** to migrate existing browser data
- **XML Export/Import**: Export your entire task list (sections, tasks, notes, settings) to XML; import from XML files or a URL
- **Storage Status Dot**: Green = connected to MySQL, blue = browser-only, red = connection error

### Mobile-Friendly
- Responsive design with optimized layouts for phone screens
- Full-width search and larger touch targets in the header
- Section action buttons stack below headers on small screens
- Task metadata (status, priority, progress, due date, assignee) in a compact grid below each task row
- Touch-friendly dropdowns and dialogs

---

## Quick Start

**Development:**
```bash
npm install
npm run dev
```

Visit `http://localhost:3000/task/` when using the default Dreamhost base path, or configure `.env.local` (see below).

**Production build:**
```bash
npm run build
# Static files are written to /out
```

---

## Deployment

| Target | URL | Storage |
|--------|-----|---------|
| [GitHub Pages](https://geph.github.io/colorful-emoji-task-management-app/) | `/colorful-emoji-task-management-app` | Browser `localStorage` |
| [jeffginger.com/task/](https://jeffginger.com/task/) | `/task` | MySQL via PHP API |

See [DATABASE.md](./DATABASE.md) for MySQL setup on Dreamhost and [DEPLOYMENT.md](./DEPLOYMENT.md) for upload instructions.

### GitHub Pages CI

Pushes to `main` automatically build and deploy to GitHub Pages via GitHub Actions. Enable Pages under **Settings → Pages → Source: GitHub Actions**.

### Dreamhost self-hosting

Copy `.env.example` to `.env.local`, set your base path and storage API URL, then build and upload the contents of `out/`:

```env
NEXT_PUBLIC_BASE_PATH=/task
NEXT_PUBLIC_ASSET_PREFIX=/task/
NEXT_PUBLIC_STORAGE_API=https://jeffginger.com/task/api/data.php
```

Upload `server/php/` to `/task/api/` on your server for MySQL sync. The app auto-detects `{your-domain}/task/api/data.php` if the env var is omitted.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_BASE_PATH` | URL prefix (e.g. `/task` or `/colorful-emoji-task-management-app`) |
| `NEXT_PUBLIC_ASSET_PREFIX` | Asset prefix matching base path |
| `NEXT_PUBLIC_STORAGE_API` | PHP endpoint URL for MySQL sync (optional — auto-detected on Dreamhost) |
| `NEXT_PUBLIC_STORAGE_API_KEY` | Shared secret sent as `X-API-Key` (only if set in PHP `config.php`) |

---

## Tech Stack

- **Framework**: Next.js 14 (static export) with React 18
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Optional backend**: PHP + MySQL on Dreamhost

---

## License

MIT
