# Ludic RPG Blog - Obsidian Workflow Guide

This folder is the Obsidian vault for Ludic RPG blog posts.

## Folder Structure

Articles live in year folders, then date folders. Each date folder contains one article file and its local `assets/` folder.

```text
src/content/blog/
  2025/
    10-22/
      the-journey-begins.md
      assets/
        the-journey-begins-cover.svg
        alien-rpg-books-table-setup.png
```

The public URL is derived from the article filename:

```text
2025/10-22/the-journey-begins.md
```

becomes:

```text
/blog/the-journey-begins/
```

## Obsidian Image Workflow

The vault is configured with Custom Attachment Location.

When you drag or paste an image into:

```text
2025/10-22/the-journey-begins.md
```

the file is saved to:

```text
2025/10-22/assets/
```

and Obsidian inserts:

```markdown
![Alt text](./assets/image-name.png)
```

Images should preview in Obsidian and render on the website. Use the bracket text for real alt text, not the filename.

## Creating A Post

1. Create or switch to a dedicated branch named `post/<title-slug>`, for example `post/alien-rpg-motion-tracker`.
2. Create a year folder if needed, for example `2026/`.
3. Create a date folder using `MM-DD`, for example `05-19/`.
4. Create an article file named with the public slug, for example `alien-rpg-motion-tracker.md`.
5. Create an `assets/` folder.
6. Insert the `blog-post` template.

Recommended frontmatter:

```yaml
---
title: "Your Post Title"
description: "A short description for SEO and previews"
teaser: "A playful question for blog cards?"
publishDate: 2026-05-19
coverImage: "./assets/alien-rpg-motion-tracker-cover.webp"
tags: ["alien-rpg", "gm-tools"]
draft: true
---
```

Keep `draft: true` until the article is ready to publish.

## Images

Cover image:

```yaml
coverImage: "./assets/alien-rpg-motion-tracker-cover.webp"
```

Inline image:

```markdown
![Motion tracker app showing a detected signal](./assets/alien-motion-tracker-detected-signal.png)
```

Responsive two-image pair:

```markdown
![First image alt text](./assets/alien-motion-tracker-admin-screen.png) ![Second image alt text](./assets/alien-motion-tracker-player-screen.png)
```

Two images in the same paragraph render side by side when there is room for two
340px images. On smaller screens, they become a horizontal swipe frame with a
small dot indicator and a brief peek animation. The image pair uses one shared
frame height so both images align cleanly.

Naming conventions:

- Use descriptive filenames for covers and inline images.
- Dragged screenshots can keep their generated names; good alt text matters more.

## YouTube Videos

For inline YouTube videos, use Obsidian's native external embed syntax:

```markdown
![Video description](https://www.youtube.com/watch?v=VIDEO_ID)
```

Save the local poster thumbnail in the same article's `assets/` folder:

```text
assets/youtube-VIDEO_ID.webp
```

Run the thumbnail refresh script to fetch and crop missing inline thumbnails:

```bash
npm run video:covers
```

The Markdown embed previews in Obsidian. The website replaces it with the lightweight privacy facade and loads the YouTube iframe only when clicked.

If `videoUrl` is present in frontmatter, these fields are required:

```yaml
videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"
videoTitle: "Video title"
videoDescription: "Video description for schema"
videoUploadDate: 2026-05-19
videoDuration: "PT2M30S"
```

## Tags

Tags affect blog organization and some card styling:

- `alien-rpg` gives green glow styling.
- `cops-rpg` gives blue glow styling.
- Other tags are categorization only.

## Pre-Publish Check

Run a local integrity check before publishing:

```bash
npm run blog:check -- your-article-slug
```

To check every non-draft article:

```bash
npm run blog:check -- --all
```

Useful options:

```bash
npm run blog:check -- your-article-slug --online
npm run blog:check -- your-article-slug --strict-assets
npm run blog:check -- your-article-slug --json
npm run blog:check -- --all --include-drafts
```

The check verifies required frontmatter, folder structure, local media paths, missing assets, heading hierarchy, image alt text, and unused files in the article's `assets/` folder. Missing referenced assets are always critical. Unused files are reported as nice-to-fix by default; add `--strict-assets` to make them critical. The optional `--online` flag also checks external URLs.

## Publishing

1. Write and preview the post.
2. Run:

   ```bash
   npm run blog:check -- your-article-slug
   npm run build
   ```

3. Set `draft: false`.
4. Commit and push.

Cloudflare Pages builds and deploys the site.

After the article is live, create a Reddit link post in `r/ludicRPG` pointing to the article URL, then attach it with:

```bash
npm run blog:reddit -- https://www.reddit.com/r/ludicRPG/comments/...
```

Use the original `r/ludicRPG` thread URL. The script sends that URL to the protected Cloudflare Pages Function, which reads the article link from the Reddit post, infers `/blog/<slug>/`, discovers crossposts, and stores the runtime metadata in Cloudflare KV. No Markdown/frontmatter edit or second site deploy is needed.

For legacy or non-`r/ludicRPG` discussions, attach the article slug explicitly:

```bash
npm run blog:reddit -- --slug your-article-slug https://www.reddit.com/r/example/comments/... https://www.reddit.com/r/other/comments/...
```

The public counter aggregates all attached posts and links the button to the Reddit post with the strongest visible score.

Reddit count refresh is progressive:

- first 48 hours after article publication: 5 minutes
- first week: 15 minutes
- first month: 1 hour
- older than one month: 6 hours

Required Cloudflare setup:

- KV binding: `REDDIT_DISCUSSIONS`
- Pages secret: `REDDIT_DISCUSSION_ADMIN_TOKEN`
- Local script env: `LUDIC_REDDIT_DISCUSSION_ADMIN_TOKEN`
