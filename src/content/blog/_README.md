# Ludic RPG Blog - Obsidian Workflow Guide

This folder is the Obsidian vault for Ludic RPG blog posts.

The repository [README](https://github.com/ludic-rpg/Home#articles) is the
operational source of truth for article branches, Markdown behavior, covers,
validation, PRs, and publication. This note remains as a compact reference
inside the vault.

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

This checkout is configured locally with Custom Attachment Location. The
`.obsidian/` folder is ignored by Git, so use the root README when setting up a
new maintainer's vault.

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
authors: [ludo]
coverImage: "./assets/alien-rpg-motion-tracker-cover.webp"
socialImage: "./assets/alien-rpg-motion-tracker-social.jpg"
socialImageAlt: "Motion tracker interface beside players reacting around the table"
tags: ["alien-rpg", "gm-tools"]
draft: true
---
```

Keep `draft: true` until the article is ready to publish.

`authors` is required and always uses an ordered array of author IDs:

```yaml
authors: [ludo]
authors: [krayorn]
authors: [ludo, krayorn]
```

Use `ludo` or `krayorn`; list both in byline order for a jointly written article.

## Images

Cover image:

```yaml
coverImage: "./assets/alien-rpg-motion-tracker-cover.webp"
```

Optional dedicated sharing image:

```yaml
socialImage: "./assets/alien-rpg-motion-tracker-social.jpg"
socialImageAlt: "Motion tracker interface beside players reacting around the table"
```

`socialImage` replaces the cover only in Open Graph, Twitter, and article
metadata. The visible article cover, blog cards, and video poster continue to
use `coverImage`. Use a landscape image near 1.91:1 so link previews remain
stable across social platforms. When omitted, sharing metadata falls back to
`coverImage`.

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

### Image Group Structure

Image presentation is derived only from Markdown paragraph structure. No HTML,
component import, class, or marker is needed:

- One image in an image-only paragraph is a solo image.
- Exactly two images in one image-only paragraph form a pair. The pair is shown
  side by side on desktop and as the paired carousel on mobile.
- Three or more images in one image-only paragraph form a gallery.
- Exactly six images form the six-item gallery, with three columns by two rows
  on desktop and two columns on mobile.
- A blank line ends the current image group.

Single line breaks between Markdown images do not create new paragraphs. This
is one three-image gallery:

```markdown
![First image](./assets/first.png)
![Second image](./assets/second.png)
![Third image](./assets/third.png)
```

Use a blank line when two pairs should remain two separate carousels:

```markdown
![First image](./assets/first.png) ![Second image](./assets/second.png)

![Third image](./assets/third.png) ![Fourth image](./assets/fourth.png)
```

Images in pairs and galleries can open in the article lightbox. A solo image
opens only when the available viewport can display it meaningfully larger than
its inline size. The lightbox reuses the same optimized image already loaded by
the article.

The detailed behavior is recorded in
[`docs/blog-image-groups-and-lightbox-spec.md`](../../../docs/blog-image-groups-and-lightbox-spec.md).

Naming conventions:

- Use descriptive filenames for covers and inline images.
- Dragged screenshots can keep their generated names while drafting. Rename
  generic files once, after the text and media are frozen for release.

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

The check verifies required frontmatter and author IDs, folder structure, local media paths, missing assets, heading hierarchy, image alt text, and unused files in the article's `assets/` folder. Missing referenced assets are always critical. Unused files are reported as nice-to-fix by default; add `--strict-assets` to make them critical. The optional `--online` flag also checks external URLs.

## Publishing

1. Write and preview the post on its `post/<article-slug>` branch.
2. When text and media are frozen, clean up generic asset filenames.
3. Set `draft: false`.
4. Run:

   ```bash
   npm run blog:check -- your-article-slug --strict-assets
   npm run deploy
   ```

5. Review and commit expected files changed by image optimization or favicon refresh.
6. Push the branch and inspect its Cloudflare preview.
7. Mark the PR ready, then squash-merge it into `main`.
8. Pull the merged `main` locally.

`npm run deploy` is a local release gate; it does not deploy. Cloudflare Pages
deploys production after the PR is merged into `main`.

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
