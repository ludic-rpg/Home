# Ludic RPG Blog - Obsidian Workflow Guide

This folder is the Obsidian vault for Ludic RPG blog posts.

## Folder Structure

Articles live in year folders. Each article has its own folder, its own `post.md` or `post.mdx`, and its own local `assets/` folder.

```text
src/content/blog/
  2025/
    10-22_the-journey-begins/
      post.md
      assets/
        cover.svg
        screenshot-1.png
```

The public URL is derived from the article folder name by removing the month-day prefix:

```text
2025/10-22_the-journey-begins/post.md
```

becomes:

```text
/blog/the-journey-begins/
```

## Obsidian Image Workflow

The vault is configured with Custom Attachment Location.

When you drag or paste an image into:

```text
2025/10-22_the-journey-begins/post.md
```

the file is saved to:

```text
2025/10-22_the-journey-begins/assets/
```

and Obsidian inserts:

```markdown
![Alt text](./assets/image-name.png)
```

Images should preview in Obsidian and render on the website. Use the bracket text for real alt text, not the filename.

## Creating A Post

1. Create a year folder if needed, for example `2026/`.
2. Create an article folder using `MM-DD_slug`, for example `05-19_alien-rpg-motion-tracker/`.
3. Create `post.md` or `post.mdx` inside it.
4. Create an `assets/` folder.
5. Insert the `blog-post` template.

Recommended frontmatter:

```yaml
---
title: "Your Post Title"
description: "A short description for SEO and previews"
teaser: "A playful question for blog cards?"
publishDate: 2026-05-19
coverImage: "./assets/cover.webp"
tags: ["alien-rpg", "gm-tools"]
draft: true
redditDiscussion: null
---
```

Keep `draft: true` until the article is ready to publish.

## Images

Cover image:

```yaml
coverImage: "./assets/cover.webp"
```

Inline image:

```markdown
![Motion tracker app showing a detected signal](./assets/screenshot-1.png)
```

Responsive two-image pair:

```markdown
![First image alt text](./assets/first-image.png) ![Second image alt text](./assets/second-image.png)
```

Two images in the same paragraph render side by side when there is room for two
340px images. On smaller screens, they become a horizontal swipe frame with a
small dot indicator and a brief peek animation. The image pair uses one shared
frame height so both images align cleanly.

Naming conventions:

- Use `cover.{ext}` for the cover.
- Use descriptive filenames for images you name yourself.
- Dragged screenshots can keep their generated names; good alt text matters more.

## YouTube Videos

For MDX posts with a YouTube component, import it from the nested article folder:

```mdx
import YouTube from '../../../../components/youtube/Facade.astro';
import coverPoster from './assets/cover.webp';

<YouTube id="VIDEO_ID" title="Video description" poster={coverPoster.src} />
```

Inline MDX videos render as lightweight facades and load the YouTube iframe only when clicked. Use a local poster image, usually the article cover, so the page does not request a YouTube thumbnail on load.

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
