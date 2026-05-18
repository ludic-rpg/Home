# Ludic RPG Blog - Obsidian Workflow Guide

This folder is configured as an **Obsidian vault** for writing blog posts. This README explains how to use it.

## Quick Start

### 1. Install Obsidian

Download from: https://obsidian.md/ (free for personal use)

### 2. Open This Vault

1. Open Obsidian
2. Click "Open folder as vault"
3. Navigate to: `/Users/ludovicfleury/Projects/ludic/home/src/content/blog`
4. Click "Open"

### 3. Create Your First Post

1. Click "Create new note" or press `Cmd+N`
2. Open command palette with `Cmd+P`
3. Type "Templates" and select "Templates: Insert template"
4. Choose "blog-post" template
5. Fill in the frontmatter (title, description, tags)
6. Start writing!

## Image Workflow (Approach B)

This blog uses **Approach B** - absolute paths for images.

### How It Works

When you drag an image into Obsidian:

1. **Image is saved to:** `public/assets/img/blog/filename.png`
2. **Obsidian inserts:** `![Description](/assets/img/blog/filename.png)`
3. **In Obsidian:** Image shows as broken (gray box) ← This is EXPECTED
4. **In browser:** Image shows perfectly ✓
5. **On Cloudflare Pages:** Image auto-optimized (WebP, responsive) ✓

### Why Images Show Broken in Obsidian

This is intentional! We use absolute paths (`/assets/...`) that work perfectly on the web, but Obsidian can't preview them because it doesn't know about the `public/` folder structure.

**This is the tradeoff for clean, web-ready URLs.**

### Previewing Your Posts

To see images and the final rendered result:

1. Open terminal in project root
2. Run: `npm run dev`
3. Open browser: `http://localhost:4321/blog`
4. Navigate to your post
5. Refresh browser when you save changes in Obsidian

**Workflow:** Write in Obsidian + Preview in Browser = Best of both worlds

## YouTube Videos

To embed a YouTube video:

```markdown
import YouTube from '../../components/YouTube.astro';

<YouTube id="VIDEO_ID" title="Video description" />
```

Replace `VIDEO_ID` with the ID from the YouTube URL:
- URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- ID: `dQw4w9WgXcQ`

## Frontmatter Structure

Every blog post needs frontmatter at the top:

```yaml
---
title: "Your Post Title"
description: "A short description for SEO and previews"
publishDate: 2026-05-15
coverImage: "/assets/img/blog/your-article-slug/cover.jpg"
videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"  # Optional
tags: ["alien-rpg", "props", "tutorial"]
draft: false
redditDiscussion: "https://reddit.com/r/ludicRPG/comments/xyz"  # Optional
---
```

### Frontmatter Fields

- `title` (required): Post title
- `description` (required): SEO description, shows in blog listing
- `publishDate` (required): Publication date (YYYY-MM-DD)
- `coverImage` (optional): Cover image stored in `/assets/img/blog/article-slug/cover.jpg`
- `videoUrl` (optional): YouTube URL - if present, embeds video instead of cover image on post page
- `tags` (optional): Array of tags for categorization
  - Use `alien-rpg` for green glow effect
  - Use `cops-rpg` for blue glow effect
- `draft` (optional): Set to `true` to hide from blog listing
- `redditDiscussion` (optional): URL to Reddit discussion thread

## Asset Organization

### Folder Structure

All assets for a blog post should be organized in a dedicated subfolder:

```
/assets/img/blog/
  your-article-slug/
    cover.jpg          # Cover image for cards and post header
    diagram-1.svg      # Inline images used in the post
    screenshot-1.png
    screenshot-2.png
```

**Benefits:**
- Better SEO (semantic URLs with keywords)
- Easy to manage all assets for a post together
- No orphaned images when deleting posts
- Clear which images belong to which post

**Naming Convention:**
- Use the article's URL slug as the folder name (kebab-case)
- Name the cover image `cover.{ext}` for consistency
- Use descriptive names for inline images

### Using Images in Posts

**Cover Image** (in frontmatter):
```yaml
coverImage: "/assets/img/blog/your-article-slug/cover.jpg"
```

**Inline Images** (in markdown):
```markdown
![Alt text description](/assets/img/blog/your-article-slug/diagram-1.svg)
```

## Tags and Visual Effects

Tags affect the visual styling:

- **`alien-rpg`** → Green glow effect (matches Alien RPG branding)
- **`cops-rpg`** → Blue glow effect (matches C.O.P.S. RPG branding)
- Other tags → No special glow, just categorization

## Publishing Workflow

### Option 1: Manual Git

1. Write post in Obsidian
2. Save (auto-saves)
3. In terminal:
   ```bash
   git add .
   git commit -m "Add blog post: Your Title"
   git push
   ```
4. Cloudflare Pages auto-builds and deploys

### Option 2: Obsidian Git Plugin (Recommended)

Install the Obsidian Git community plugin for automatic commits:

#### Setup

1. In Obsidian: Settings → Community plugins → Turn off Safe mode
2. Browse → Search "Obsidian Git" → Install → Enable
3. Settings → Obsidian Git:
   - Auto backup interval: `10` (minutes)
   - Auto backup after file change: ON
   - Commit message: `blog update: {{date}}`
   - Auto pull on startup: ON
   - Auto push: ON

#### Result

- Every 10 minutes, Obsidian auto-commits your changes
- Auto-pushes to GitHub
- Cloudflare Pages auto-builds
- **You never manually commit!** Just write and it deploys.

## File Organization

```
src/content/blog/
├── .obsidian/              # Obsidian vault configuration
│   ├── app.json            # Image settings (Approach B)
│   ├── templates/
│   │   └── blog-post.md    # Template for new posts
│   └── ...
├── README.md               # This file
├── example-post.md         # Example post (delete or set draft: true)
└── your-posts.md           # Your blog posts here

public/assets/img/blog/     # Blog images stored here
```

## Markdown Features

All standard markdown works:

- **Bold**, *italic*, `code`
- Headers (H2, H3, H4)
- Lists (ordered and unordered)
- Links
- Blockquotes
- Code blocks
- Horizontal rules

## Tips & Tricks

### 1. Use Templates

Templates save time. The blog post template includes:
- Pre-filled frontmatter structure
- Today's date
- Import statement for YouTube component
- Helpful comments

### 2. Keep Dev Server Running

While writing:
- Terminal: `npm run dev`
- Browser: `localhost:4321/blog`
- Write in Obsidian
- Save
- Refresh browser to see rendered result

### 3. Image Naming

Name images descriptively:
- ✓ `motion-tracker-prototype.png`
- ✓ `bishop-video-screenshot.jpg`
- ✗ `IMG_1234.png`
- ✗ `screenshot.png`

This helps with SEO and organization.

### 4. Alt Text for Images

Always add descriptive alt text:

```markdown
![Motion tracker prototype showing radar display](/assets/img/blog/prototype.png)
```

Good for:
- SEO
- Accessibility
- Context when image fails to load

### 5. Reddit Integration

After publishing a post:
1. Post announcement to r/ludicRPG
2. Copy Reddit post URL
3. Add to frontmatter: `redditDiscussion: "URL"`
4. Re-deploy
5. "Discuss on Reddit" button appears on post

## Example Post Structure

```markdown
---
title: "Building a Motion Tracker for Alien RPG"
description: "How I created an iOS/Android app using phone sensors"
publishDate: 2026-05-15
coverImage: "/assets/img/blog/motion-tracker-hero.jpg"
tags: ["alien-rpg", "app-development", "props"]
draft: false
---

import YouTube from '../../components/YouTube.astro';

## Introduction

The motion tracker from *Aliens* is iconic...

![Prototype](/assets/img/blog/prototype.png)

## Development

### Phase 1: Research

I started by researching phone sensors...

### Phase 2: Implementation

<YouTube id="VIDEO_ID" title="Demo" />

## Download

Available on iOS and Android...
```

## Troubleshooting

### Images not showing in Obsidian

**This is expected!** Images use absolute paths (`/assets/...`) that work on the web but not in Obsidian. Preview in browser instead.

### Images not showing in browser

1. Check file path is correct: `/assets/img/blog/filename.png`
2. Check file exists in `public/assets/img/blog/`
3. Check filename matches exactly (case-sensitive)
4. Restart dev server: `npm run dev`

### Build errors

1. Check frontmatter is valid YAML
2. Ensure `publishDate` is a valid date: `YYYY-MM-DD`
3. Check for unclosed code blocks or quotes
4. Run `npm run build` to see detailed errors

### Git conflicts

If using Obsidian Git and getting conflicts:
1. Open terminal in project root
2. Run: `git pull --rebase`
3. Resolve conflicts
4. Run: `git push`

## Support

Questions or issues? Check:
- [Example post](example-post.md) for reference
- [Astro Content Collections docs](https://docs.astro.build/en/guides/content-collections/)
- [Obsidian documentation](https://help.obsidian.md/)

Happy writing! 🚀
