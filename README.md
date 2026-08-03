# Ludic RPG website

This repository contains the public [Ludic RPG](https://ludicrpg.com/) website and blog. It is a static [Astro](https://astro.build/) site deployed by Cloudflare Pages from GitHub.

This guide is the shared maintainer reference for Ludo and Krayorn. It covers local development, performance, releases, articles, homepage features, and structured data. It does not prescribe how an article should be written.

## Contents

- [Local development](#local-development)
- [Command reference](#command-reference)
- [Web performance targets](#web-performance-targets)
- [Deployment pipeline](#deployment-pipeline)
- [Articles](#articles)
- [Homepage featured articles](#homepage-featured-articles)
- [SEO, metadata, and JSON-LD](#seo-metadata-and-json-ld)
- [Repository map](#repository-map)

## The short version

- Use Node `22.12.0`, as pinned in [`.node-version`](./.node-version).
- Do all work on a branch and open a pull request. Do not push directly to `main`.
- Run `npm run deploy` before a PR is merged.
- `npm run deploy` is a local release gate. It does not deploy anything by itself.
- Cloudflare creates a preview for the PR branch. A merge into `main` triggers production.
- Review `git status` after build and release commands. Image optimization and favicon refresh can change files.
- Squash-merge approved PRs so `main` stays readable.

## Local development

### Requirements

- Git
- Node.js `22.12.0`
- npm
- GitHub CLI (`gh`) for the PR commands shown below

With `nvm`:

```bash
git clone git@github.com:ludic-rpg/Home.git
cd Home
nvm install
nvm use
npm ci
npm run dev
```

The development server is available at [http://localhost:4321](http://localhost:4321).

Build and inspect the production output locally:

```bash
npm run build
npm run preview
```

Astro writes the static site to `dist/`.

The repository also contains a Docker setup, but it currently uses a different Node version. Native Node with `.node-version` is the reference setup.

## Command reference

| Command | What it does | Can change tracked files? |
| --- | --- | --- |
| `npm run dev` | Starts the Astro development server. | No |
| `npm run build` | Runs `prebuild`, then creates the static site in `dist/`. | Yes, favicon cache files can change. |
| `npm run preview` | Serves the existing production build locally. | No |
| `npm run deploy` | Runs the complete local release gate described below. It does not push, merge, or deploy. | Yes |
| `npm run assets:check` | Checks the repository image rules without converting files. | No |
| `npm run assets:optimize` | Converts eligible PNG/JPEG images to WebP, updates safe references, and removes replaced rasters. | Yes |
| `npm run blog:check -- <slug>` | Audits one article, including an article with `draft: true`. | No |
| `npm run blog:check -- --all` | Audits all published articles. Drafts are excluded. | No |
| `npm run blog:check -- --all --include-drafts` | Audits every article, including drafts. | No |
| `npm run video:covers -- --only=<slug>` | Refreshes local YouTube cover and facade images for one article. | Yes |
| `npm run links:favicons` | Refreshes the local icons used beside external Markdown links. | Yes |
| `npm run links:favicons:check` | Verifies that external-link icons are complete. | No |
| `npm run blog:reddit -- <reddit-url>` | Attaches a live Reddit discussion to a published article through the Cloudflare function. | External state only |

Useful article-check options:

```bash
npm run blog:check -- <slug> --online
npm run blog:check -- <slug> --strict-assets
npm run blog:check -- <slug> --json
```

- `--online` checks whether external URLs respond.
- `--strict-assets` makes unused article assets fail the check.
- `--json` produces machine-readable output.

### Script map

| Script | Used by | Responsibility |
| --- | --- | --- |
| [`scripts/assets.mjs`](./scripts/assets.mjs) | `assets:check`, `assets:optimize` | Verifies or converts eligible images and updates safe references. |
| [`scripts/blog-check.mjs`](./scripts/blog-check.mjs) | `blog:check` | Audits article frontmatter, structure, authors, links, and local media. |
| [`scripts/refresh-youtube-covers.mjs`](./scripts/refresh-youtube-covers.mjs) | `video:covers` | Creates local WebP covers and inline facade posters from YouTube thumbnails. |
| [`scripts/refresh-link-favicons.mjs`](./scripts/refresh-link-favicons.mjs) | `links:favicons`, `links:favicons:check` | Maintains the local favicon cache for external Markdown links. |
| [`scripts/set-reddit-discussion.mjs`](./scripts/set-reddit-discussion.mjs) | `blog:reddit` | Sends a published Reddit discussion URL to the protected Cloudflare endpoint. |

## Web performance targets

These are team targets. They are not currently enforced by CI.

### Field targets

At the 75th percentile, for both mobile and desktop:

| Metric | Good target |
| --- | --- |
| Largest Contentful Paint (LCP) | `<= 2.5 s` |
| Interaction to Next Paint (INP) | `<= 200 ms` |
| Cumulative Layout Shift (CLS) | `<= 0.1` |

These are Google's current [Core Web Vitals thresholds](https://web.dev/articles/vitals). Field data has priority over a perfect local score because it reflects real devices, connections, and visitors.

### Release check

Use mobile Lighthouse on these representative pages:

- `/`
- `/blog/`
- `/about/`
- at least one media-rich article

Target `90` or higher for Performance, Accessibility, Best Practices, and SEO, with no unexplained regression from the previous release. Lighthouse considers scores from 90 to 100 good, as described in [Chrome's performance scoring documentation](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

This check is manual today. There is no committed Lighthouse workflow, page-weight budget, or JavaScript bundle budget.

### Performance guardrails

- Keep public raster images and article covers in WebP where possible.
- Give images explicit dimensions or a stable aspect ratio so layout does not jump.
- Lazy-load below-the-fold media. Reserve eager loading and high fetch priority for the page's LCP image.
- Keep video and iframe loading behind a poster or user action. The YouTube facade already does this.
- Avoid new client-side JavaScript and dependencies unless they improve the reader experience enough to justify their cost.
- Test mobile and reduced-motion behavior, not only a wide desktop viewport.
- Run `npm run deploy` so the existing asset and content checks are applied.

`assets:optimize` covers raster files in `public/assets/img/` and article covers named `cover.png`, `cover.jpg`, or `cover.jpeg`. It does not optimize every arbitrary inline article image, so prepare those as WebP before committing when practical.

## Deployment pipeline

### What the release gate runs

```text
npm run deploy
  1. assets:optimize
  2. blog:check -- --all
  3. npm run build
       prebuild:
         a. assets:check
         b. links:favicons
         c. links:favicons:check
       astro build
```

This pipeline:

1. Converts eligible images and updates their references.
2. Checks every non-draft article.
3. Verifies image rules.
4. Creates, updates, or removes cached favicons for external Markdown links.
5. Verifies the favicon cache.
6. Builds the complete static site.

Both `assets:optimize` and `links:favicons` can modify or delete generated assets. Always inspect the diff after the command:

```bash
npm run deploy
git status --short
git diff
```

Commit relevant generated changes with the source change that caused them.

### Branch to production

1. Create a branch from an up-to-date `main`.
2. Make and review the change locally.
3. Run `npm run deploy`.
4. Commit any expected generated changes.
5. Push the branch and open a PR.
6. Inspect the Cloudflare branch preview and its PR check.
7. Mark the PR ready when review is complete.
8. Squash-merge the PR into `main`.
9. Cloudflare builds and deploys production from `main`.
10. Pull the merged `main` locally.

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/<short-name>

# Work, validate, and commit.
git push -u origin feature/<short-name>
gh pr create --draft --base main

# After the PR is squash-merged.
git switch main
git pull --ff-only origin main
```

There is currently no GitHub Actions workflow. Cloudflare Pages is the remote PR check and deployment system. Its project settings, build command, environment bindings, and production branch live in the Cloudflare dashboard rather than this repository.

### Preview URLs and SEO

Cloudflare provides branch and commit preview URLs. Preview responses must keep the HTTP header:

```text
X-Robots-Tag: noindex
```

The pages also keep canonical URLs pointing to `https://ludicrpg.com`. Together, these prevent a branch preview from competing with production as duplicate content. Cloudflare documents this default in [Preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/).

Check a new preview when Cloudflare settings change:

```bash
curl -I https://<preview-host>/<path>
```

Production must not return the preview `noindex` header.

### Optional Codex helpers

These personal Codex skills wrap parts of the same workflow. They are conveniences, not repository requirements, and may need to be installed separately for each maintainer.

| Skill | When to use it | What it does |
| --- | --- | --- |
| `ludic-home-deploy` | Preparing or completing a website release | Protects branch scope, runs the release gate, reviews generated changes, and follows the PR, squash-merge, and post-merge flow. |
| `blog-release-asset-cleanup` | Once, after an article's text and media are frozen for release | Renames generic imported files to meaningful names, updates Markdown references, and validates the target article. It does not publish or deploy. |
| `ludic-youtube-cover-refresh` | A video-backed article needs a fresh local YouTube poster | Dry-runs and refreshes the article cover, validates the build, and checks that the built site has no runtime thumbnail dependency on YouTube. |

The npm commands and this README remain the shared source of truth if a skill is unavailable.

## Articles

This section covers article files, Obsidian behavior, Markdown media, covers, validation, PRs, and publication. Editorial and writing decisions are intentionally separate.

### File and URL structure

Every new article has its own dated folder, Markdown file, and local assets folder:

```text
src/content/blog/
  2026/
    08-03/
      article-slug.md
      assets/
        cover.webp
        descriptive-inline-image.webp
```

The filename is the public slug. Dates organize the source but do not appear in the public URL:

```text
src/content/blog/2026/08-03/article-slug.md
https://ludicrpg.com/blog/article-slug/
```

The folder date must match `publishDate`.

### Obsidian vault setup

Open `src/content/blog/` as an Obsidian vault. Do not open the repository root as the blog vault.

The `.obsidian/` folder is ignored by Git, so each maintainer configures it locally:

1. In **Files & Links**, turn **Use Wikilinks** off.
2. Keep Markdown links on and enable automatic internal-link updates.
3. Set the base attachment folder to `assets`.
4. Install and enable the **Custom Attachment Location** community plugin.
5. Configure its attachment folder as `${noteFolderPath}/assets`.
6. Configure its Markdown URL format as `./assets/${generatedAttachmentFileName}`.
7. Optionally set the template folder to `.obsidian/templates` and save the frontmatter example below as `blog-post.md`.

Expected drag-and-drop behavior:

```text
2026/08-03/article-slug.md
2026/08-03/assets/pasted-image.png
```

```markdown
![Describe what a reader needs to understand](./assets/pasted-image.png)
```

Obsidian is the editor, but Astro is the renderer. Use standard Markdown syntax and treat the website preview as authoritative.

Do not use Obsidian wikilinks or embeds:

```markdown
[[another article]]
![[image.png]]
```

Also avoid these Obsidian-only forms:

- `> [!NOTE]` callouts have no special website rendering. The marker remains visible in a normal blockquote.
- `![Description|697](./assets/image.webp)` does not resize an image. `|697` becomes part of its alt text.
- Astro component imports do not work in article files. Articles are `.md`, not MDX.

Renaming the article file changes its public URL. Obsidian cannot update manually written `/blog/<slug>/` links elsewhere in the site, so search for the old route before renaming a published article.

### Frontmatter

Start a normal article with:

```yaml
---
title: "Article title"
description: "Concise search and sharing description"
teaser: "A specific, playful question for article cards?"
publishDate: 2026-08-03
authors: [ludo]
coverImage: "./assets/cover.webp"
tags: [tag-one, tag-two]
draft: true
---
```

Valid author arrays are ordered by byline order:

```yaml
authors: [ludo]
authors: [krayorn]
authors: [ludo, krayorn]
```

`title`, `description`, `publishDate`, `authors`, `tags`, and `draft` are required. A cover and question-form teaser are strongly expected and reported when missing.

The layout creates the article's only H1 from `title`. Start the body at `##`, then use `###` beneath it. Do not add a `#` heading in the Markdown body.

### Links

Use public routes for links within Ludic RPG, not source `.md` paths:

```markdown
[Another article](/blog/another-article/)
[A section in that article](/blog/another-article/#section-heading)
[The Alien RPG tag](/blog/tags/alien-rpg/)
[A section in this article](#section-heading)
```

Use full HTTPS URLs for external links:

```markdown
[Krayorn's website](https://www.krayorn.com/)
```

An image can deliberately link to another page:

```markdown
[![Screenshot of a Reddit post](./assets/reddit-post.webp)](https://www.reddit.com/)
```

A linked image does not receive the article lightbox and cannot participate in an automatic pair or gallery.

External text links receive a locally cached favicon during `npm run build`. This is why a build can update `src/data/link-favicons.json` and `public/assets/link-icons/`.

Avoid links to localhost, Cloudflare previews, source files, or Obsidian note paths in published content.

### Inline images

Keep article-owned media in the article's own `assets/` folder and use relative paths:

```markdown
![Motion tracker showing a detected signal](./assets/motion-tracker-signal.webp)
```

Alt text should describe the useful visual information. It should not be a filename, and it should not be left empty unless the image is genuinely decorative.

The bracket text is alternative text, not a visible caption. There is no dedicated Markdown caption syntax today. Put a visible explanation in a normal paragraph after the image.

A blank line determines where one image group ends and another begins. Image grouping uses plain Markdown only. Do not add imports, CSS classes, or custom HTML.

#### One image

One image in an image-only paragraph renders as a solo image:

```markdown
![A single table setup](./assets/table-setup.webp)
```

#### Two-image carousel

Exactly two images in the same image-only paragraph form a pair:

```markdown
![GM screen](./assets/gm-screen.webp) ![Player screen](./assets/player-screen.webp)
```

On desktop they render side by side. On mobile they become a horizontal swipe carousel with a dot indicator and a short peek animation.

Both images share one frame ratio and can be cropped with `object-fit: cover`. Keep essential details away from the edges.

#### Gallery

Three or more images in the same image-only paragraph form a gallery. Line breaks are allowed, but there must be no blank line between the images:

```markdown
![First prop](./assets/first-prop.webp)
![Second prop](./assets/second-prop.webp)
![Third prop](./assets/third-prop.webp)
```

Exactly six images use the dedicated six-item layout: three columns by two rows on desktop, then two columns on mobile.

Gallery cells use square frames with `object-fit: contain`. Galleries remain grids on mobile; only two-image pairs become carousels.

To make two separate pairs, add a blank line:

```markdown
![First image](./assets/first.webp) ![Second image](./assets/second.webp)

![Third image](./assets/third.webp) ![Fourth image](./assets/fourth.webp)
```

Pair and gallery images automatically participate in the lightbox. A solo image opens only when the viewport can display it meaningfully larger. See [the image groups and lightbox specification](./docs/blog-image-groups-and-lightbox-spec.md) for implementation details.

Do not mix text, captions, links, or other elements into an image-group paragraph. The automatic classifier only recognizes direct images in an otherwise empty paragraph.

### Article cover and social cover

`coverImage` is the main article media:

```yaml
coverImage: "./assets/cover.webp"
```

It is used by the visible article header, blog cards, article metadata, and as the fallback sharing image. There is no enforced pixel size. Prefer a large landscape WebP close to `2:1`, and keep important content away from the edges. The article header crops to `2:1`; blog cards use `16:9` and become an even wider `21:9` on small screens.

An optional dedicated social image replaces the cover only in Open Graph, Twitter, and structured article metadata:

```yaml
socialImage: "./assets/article-social.jpg"
socialImageAlt: "The article's main subjects composed for a wide sharing card"
```

The visible article and cards still use `coverImage`. A `1.91:1` landscape composition, commonly `1200 x 630`, is a good social target. If `socialImage` is omitted, sharing metadata falls back to `coverImage`.

Cover rules:

- Keep the file inside the article's `assets/` folder.
- Keep the frontmatter path relative and beginning with `./assets/`.
- Prefer WebP for the visible cover.
- Use descriptive filenames for special covers. The conventional generic name is `cover.webp`.
- Do not rely on a remote image URL for article-owned media.
- `npm run assets:optimize` automatically converts generic `cover.png`, `cover.jpg`, and `cover.jpeg` files to `cover.webp` and updates their frontmatter reference.
- Descriptively named PNG/JPEG covers and arbitrary inline images are not converted automatically.
- WebP is preferred for photos and screenshots. SVG remains appropriate for diagrams.

### YouTube-backed covers and inline videos

For a video as the article's main cover, add:

```yaml
videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"
videoTitle: "Accessible video title"
videoDescription: "What the video shows and why it matters"
videoUploadDate: 2026-08-03
videoDuration: "PT2M30S"
coverImage: "./assets/cover.webp"
```

When `videoUrl` is present, `coverImage`, `videoTitle`, `videoDescription`, and `videoUploadDate` are required. `videoDuration` is optional but recommended. The page shows the local cover first and loads the privacy-enhanced YouTube player only after a click. The same fields generate `VideoObject` structured data.

Refresh the local cover from YouTube for one article:

```bash
npm run video:covers -- --only=<article-slug> --dry-run
npm run video:covers -- --only=<article-slug>
```

The script downloads the best available YouTube thumbnail, removes detected black bars at the left and right, and writes a clean local WebP without adding a play button or logo. Use `--force` if the configured cover file does not exist yet or existing inline posters must be replaced:

```bash
npm run video:covers -- --only=<article-slug> --force
```

Keep the configured output path ending in `.webp`; the script encodes WebP output.

For an inline YouTube video, put Obsidian's external image embed on its own line:

```markdown
![Motion tracker table test](https://www.youtube.com/watch?v=VIDEO_ID)
```

Then generate its local facade poster:

```bash
npm run video:covers -- --only=<article-slug>
```

The poster is stored as:

```text
./assets/youtube-VIDEO_ID.webp
```

The website replaces the Markdown image with its lightweight YouTube facade. The built page must not load a remote YouTube thumbnail or iframe before the reader clicks.

Only `videoUrl` in frontmatter creates `VideoObject` JSON-LD. Inline YouTube embeds do not currently add structured video metadata.

### Article branch and PR flow

Use one article per `post/<article-slug>` branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c post/<article-slug>
```

Create:

```text
src/content/blog/YYYY/MM-DD/<article-slug>.md
src/content/blog/YYYY/MM-DD/assets/
```

While drafting, keep `draft: true` and validate the article directly:

```bash
npm run blog:check -- <article-slug>
npm run build
```

Important: `draft: true` removes the article route from every rendered site, including local builds and Cloudflare PR previews. The GitHub draft-PR state and article frontmatter are different controls:

- `draft: true` means Astro does not render the article route.
- A draft PR means GitHub does not consider the PR ready to merge.

When reviewers need a working preview URL, set `draft: false` on the article branch and keep the PR itself in draft until the article is genuinely ready.

Push and open a draft PR:

```bash
git push -u origin post/<article-slug>
gh pr create --draft --base main
```

### Article release checklist

1. Freeze the text and media set.
2. Rename generic imported image files and update their references. If available, run `blog-release-asset-cleanup` once for this step.
3. Refresh YouTube covers or inline posters if needed.
4. Set `draft: false`.
5. Run the individual article check.
6. Run the complete website release gate.
7. Inspect and commit expected optimizer or favicon changes.
8. Push, inspect the Cloudflare preview, and mark the PR ready.
9. Squash-merge the PR into `main`.
10. Let Cloudflare deploy production, then pull `main` locally.

```bash
npm run blog:check -- <article-slug> --strict-assets
npm run deploy
git status --short
git push
```

After the article is live, a Reddit link post can be attached to its on-site discussion counter:

```bash
npm run blog:reddit -- https://www.reddit.com/r/ludicRPG/comments/...
```

This requires `LUDIC_REDDIT_DISCUSSION_ADMIN_TOKEN` locally. Cloudflare also needs the `REDDIT_DISCUSSIONS` KV binding and `REDDIT_DISCUSSION_ADMIN_TOKEN` secret. See [`.env.example`](./.env.example).

## Homepage featured articles

Homepage feature selection is curated, not automatically based on the newest article. The source of truth is [`src/data/homeFeaturedArticles.ts`](./src/data/homeFeaturedArticles.ts).

The same configuration is consumed by:

- [`src/components/home/Hero.astro`](./src/components/home/Hero.astro) for the visible homepage blocks.
- [`src/pages/index.astro`](./src/pages/index.astro) for the homepage JSON-LD `ItemList`.

### Ludo's current internal feature

Set the exact public article slug:

```ts
export const HOME_FEATURED_LUDO_SLUG = 'article-slug';
```

The title, teaser or description, image, date, authors, URL, and structured data are derived from that article's frontmatter. The article must exist and have `draft: false`. A missing, renamed, or draft slug removes the feature from both the visible homepage and its JSON-LD.

### Krayorn's current external feature

Update all fields together:

```ts
export const HOME_FEATURED_KRAYORN = {
  title: 'Visible article title',
  schemaHeadline: 'Canonical article headline',
  description: 'Short article description.',
  url: 'https://www.krayorn.com/posts/article/',
} as const;
```

The current implementation treats Ludo's side as an internal Ludic post and Krayorn's side as an external article. The avatars and profile links are also assigned by side. Featuring an internal Krayorn article or an external Ludo article requires a small code change in both homepage consumers, not only a configuration edit.

After changing either feature:

1. Check the homepage at mobile and desktop widths.
2. Confirm the title, avatar, nudge, and hover behavior.
3. Confirm the link target.
4. Build and validate the homepage structured data.

## SEO, metadata, and JSON-LD

SEO data is generated from shared entities and page inputs. Do not paste independent JSON-LD scripts into individual pages unless the shared model genuinely cannot express the page.

### Sources of truth

| File | Responsibility |
| --- | --- |
| [`src/layouts/BaseLayout.astro`](./src/layouts/BaseLayout.astro) | `<title>`, description, canonical, robots, Open Graph, Twitter cards, RSS discovery, and the final JSON-LD graph. |
| [`src/lib/seo/constants.ts`](./src/lib/seo/constants.ts) | Production URL, brand data, and stable entity IDs. |
| [`src/lib/seo/jsonLd.ts`](./src/lib/seo/jsonLd.ts) | Builders for the Organization, people, website, pages, articles, videos, lists, and breadcrumbs. |
| [`src/lib/blog/authors.ts`](./src/lib/blog/authors.ts) | Author IDs, names, archives, profiles, avatars, and Person entity references. |
| [`src/layouts/BlogPostLayout.astro`](./src/layouts/BlogPostLayout.astro) | Maps article frontmatter to visible bylines, article metadata, `BlogPosting`, `VideoObject`, and breadcrumbs. |

Every normal page graph includes:

- `Organization` for Ludic RPG
- `Person` for Ludo
- `Person` for Krayorn
- `WebSite`
- the current `WebPage` subtype

Depending on the route, the graph can also include:

- `BlogPosting`
- `VideoObject`
- `BreadcrumbList`
- `ItemList`
- `CollectionPage`
- `ProfilePage`
- `AboutPage`

### Rules for changes

- Canonical and schema URLs must be absolute production URLs on `https://ludicrpg.com`, never localhost or a preview host.
- Keep stable `@id` values in `ENTITY_IDS`. Reuse an existing entity instead of creating another Ludo, Krayorn, Ludic RPG, or website node.
- Structured data must match visible content. Do not describe people, articles, videos, or links that the page does not actually present.
- Add article authors through the `authors` frontmatter array and shared author registry.
- Use `resolveBlogAsset` for article-owned media passed into metadata so the final URL is crawlable.
- Let collection routes build their `ItemList` from the same articles they display.
- Keep homepage feature JSON-LD derived from the same configuration as the visible blocks.
- A video-backed article needs complete video frontmatter so its `VideoObject` is valid.

### Validation

There is no automated rich-results or JSON-LD validator in CI. The Astro content schema and blog checker catch many structural mistakes, but external validation remains a release check.

1. Run `npm run build`.
2. Inspect the generated route in `dist/<route>/index.html`.
3. Confirm there is one coherent `application/ld+json` graph.
4. Test the public or preview page with the [Schema.org validator](https://validator.schema.org/).
5. Test eligible article and video markup with [Google's Rich Results Test](https://search.google.com/test/rich-results).
6. Compare the graph with the visible title, description, authors, image, date, and links.

For a quick local inspection:

```bash
rg -n 'application/ld\+json|canonical|og:title|twitter:title' dist/<route>/index.html
```

## Repository map

```text
src/components/       Reusable interface components
src/content/blog/     Article source and local article assets
src/data/             Curated site data and feature configuration
src/layouts/          Shared page, article, and section layouts
src/lib/blog/         Article and author helpers
src/lib/seo/          Metadata and JSON-LD entities
src/pages/            Astro routes
src/scripts/          Browser-side behavior
src/styles/           Shared styles
scripts/              Build, validation, asset, and publishing helpers
public/               Static files, headers, fonts, images, and videos
functions/            Cloudflare Pages Functions
docs/                 Durable product and implementation references
```

For product language, design decisions, and the Ludic RPG experience principles, read [`docs/ludic-rpg-project-context.md`](./docs/ludic-rpg-project-context.md).
