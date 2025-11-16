# Ludic RPG Website

Multi-language static website built with Astro, featuring automatic language detection via Cloudflare.

## Features

- 🌍 Multi-language (English/French) with automatic browser detection
- 🔍 SEO-optimized with proper hreflang tags
- ⚡ Static site deployed on Cloudflare Pages
- 🚀 Automated redirect rule deployment

## Quick Start

### Development

```bash
npm install
npm run dev
```

Visit:
- English: http://localhost:4321/
- French: http://localhost:4321/fr/

### Production

Push to GitHub - Cloudflare Pages automatically builds and deploys everything.

## Cloudflare Setup (One-Time)

Add these environment variables in Cloudflare dashboard:

1. Go to **Workers & Pages** → Select your Pages project → **Settings** → **Environment variables**
2. Click **Add variable** and add for **Production** environment:

| Variable | Value | Type | Where to Find |
|----------|-------|------|---------------|
| `CLOUDFLARE_ZONE_ID` | Your zone ID | **Secret** (check "Encrypt") | Dashboard → Your site → Overview → Zone ID |
| `CLOUDFLARE_API_TOKEN` | API token | **Secret** (check "Encrypt") | [Create token](https://dash.cloudflare.com/profile/api-tokens) with `Zone.Dynamic Redirect.Edit` |

**Important:** Check the "Encrypt" checkbox for both variables to make them secrets.

That's it! The redirect rule now deploys automatically with every push.

## How It Works

**URL Structure:**
- `ludicrpg.com/` - English (default)
- `ludicrpg.com/fr` - French

**Automatic Redirect:**
- French browsers → automatically redirected to `/fr`

**Build Process:**
```
git push → Cloudflare Pages → astro build → deploy redirect rule → publish
```

## Project Structure

Simple multi-language setup - no complex i18n framework needed! Just duplicate pages and content.

```
src/
├── content/              # Content in Markdown (symmetric)
│   ├── en/home.md       # English content
│   └── fr/home.md       # French content
├── lib/
│   └── content.ts       # Markdown loader utility
├── components/
│   └── LanguageSwitcher.astro
├── layouts/
│   └── BaseLayout.astro # SEO + hreflang tags
└── pages/               # Page templates
    ├── index.astro      # English → outputs to /
    └── fr/
        └── index.astro  # French → outputs to /fr/

cloudflare/
├── redirect-rule.json   # Browser language detection rule
└── deploy-redirect-rule.sh

scripts/
└── post-build.sh        # Auto-deploys redirect rule
```

**How it works:**
- **Content is symmetric:** Both languages have `content/en/` and `content/fr/` folders
- **Pages follow Astro convention:** Default language at root for clean URLs (`/` not `/en/`)
- **No framework needed:** Just simple page duplication, each loading its own Markdown content

## Editing Content

All content is in Markdown files with frontmatter. Simply edit:

- **English**: [src/content/en/home.md](src/content/en/home.md)
- **French**: [src/content/fr/home.md](src/content/fr/home.md)

**Example format:**
```markdown
---
title: "Ludic RPG - Tabletop RPG Designer"
description: "Tabletop RPG designer and content creator..."
heroTitle: "Ludic RPG"
heroTagline: "Crafting unique RPG experience"
---

# About
Creative experiments mixing narrative...
```

Push to deploy - that's it!

### Update Redirect Rule

Edit [cloudflare/redirect-rule.json](cloudflare/redirect-rule.json), commit, and push. It deploys automatically.

## Links

- Website: https://ludicrpg.com
- Reddit: https://reddit.com/r/ludicRPG
- YouTube: https://youtube.com/@ludicRPG
- Discord: https://discord.gg/WYQMvQcYgP
- GitHub: https://github.com/ludic-rpg
- Patreon: https://patreon.com/ludicRPG
