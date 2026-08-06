# 遊戲亡 — Personal Website

Personal website for [遊戲亡 (@gdnb_v2.0)](https://www.youtube.com/@gdnb_v2.0), a Taiwanese creator focused on Minecraft maps, game development, and video editing.

Live at: **[gdnb.net](https://gdnb.net)**

## Features

- **Blog** — Markdown posts with view counts and likes
- **Portfolio** — Project showcase with GitHub links, custom links (itch.io, demo, etc.), and cover images
- **MC Map Downloads** — Minecraft map download hub served from a self-hosted Raspberry Pi, with download counter and optional resource pack
- **Videos** — YouTube video gallery, auto-synced via YouTube Data API v3
- **Admin Dashboard** — Password-protected CMS to create, edit, and delete all post types, with daily stats charts and site settings

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [SQLite](https://www.sqlite.org/) via `better-sqlite3`
- [NextAuth v5](https://authjs.dev/) for admin authentication
- Self-hosted on a Raspberry Pi 4 behind [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

## Getting Started

### Prerequisites

- Node.js 20+
- A Raspberry Pi (or any Linux server) for self-hosting

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

Create `.env.local`:

```env
AUTH_SECRET=your-random-secret       # openssl rand -base64 32
NEXT_PUBLIC_BASE_URL=http://localhost:3000
YOUTUBE_API_KEY=your-yt-api-key      # optional, needed for video sync
```

Initialize the database and create the admin account:

```bash
node database/seed.js
```

Default credentials: `admin` / `password123` — **change this before deploying.**

```bash
npm run dev
```

Admin panel is at `/admin/login`.

## Project Structure

```
src/
├── app/
│   ├── (public pages)   # blog, portfolio, minecraft, videos
│   ├── admin/           # CMS dashboard
│   └── api/             # REST API routes
├── components/
│   ├── admin/           # CMS form components
│   └── ...              # shared UI components
database/
├── schema.sql           # SQLite schema
└── seed.js              # DB init + admin user creation
public/
├── images/uploads/      # uploaded cover images
└── maps/                # Minecraft map zip files
```

## License

[MIT](./LICENSE)
