# Maintaining the Ludic RPG website

This repository contains the public [Ludic RPG website and blog](https://ludicrpg.com/). It is a static [Astro](https://astro.build/) site hosted by Cloudflare Pages.

This guide is for Ludo and Krayorn. It explains how to run the site, make a change, publish an article, choose homepage features, and keep performance and metadata healthy. It does not prescribe how an article should be written.

Before changing public copy, navigation, positioning, or visual direction, read the short project compass in [`docs/ludic-rpg-project-context.md`](./docs/ludic-rpg-project-context.md).

## Start here

Most changes follow the same path:

```text
Create a branch
  -> work and preview locally
  -> validate the change
  -> open a pull request
  -> inspect the Cloudflare preview
  -> squash-merge into main
  -> Cloudflare deploys production
```

Three rules matter most:

1. Do not work directly on `main`.
2. `npm run deploy` validates the site locally. It does not publish anything.
3. Merging into `main` is what triggers the production deployment.

Use the section that matches what you are doing:

- [Set up the project](#set-up-the-project)
- [Find the part of the site you need](#find-the-part-of-the-site-you-need)
- [Make a website change](#make-a-website-change)
- [Create and publish an article](#create-and-publish-an-article)
- [Change the homepage featured articles](#change-the-homepage-featured-articles)
- [Work with SEO and JSON-LD](#work-with-seo-and-json-ld)
- [Check performance](#check-performance)
- [Look up a command](#command-reference)

## Set up the project

You need:

- Git with GitHub SSH access configured
- `nvm`, or Node.js `22.12.0` installed another way; the version is pinned in [`.node-version`](./.node-version)
- npm
- GitHub CLI (`gh`), authenticated for the pull-request commands in this guide

Cloudflare dashboard access is only needed when changing deployment settings, bindings, or secrets.

Clone and start the site. These commands use `nvm`; if Node `22.12.0` is already active through another version manager, skip the two `nvm` lines:

```bash
git clone git@github.com:ludic-rpg/Home.git
cd Home
nvm install
nvm use
npm ci
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

When you need to inspect the production build locally:

```bash
npm run build
npm run preview
```

Astro writes the built site to `dist/`.

## Find the part of the site you need

```text
src/components/       Reusable interface components
src/content/blog/     Article Markdown and article-owned assets
src/data/             Curated site data and homepage feature configuration
src/layouts/          Shared page and article layouts
src/lib/blog/         Article and author helpers
src/lib/seo/          Metadata and JSON-LD entities
src/pages/            Astro routes
src/scripts/          Browser-side behavior
src/styles/           Shared styles
scripts/              Build, validation, asset, and publishing helpers
public/               Static files, headers, fonts, images, and videos
functions/            Cloudflare Pages Functions
docs/                 Product and implementation references
```

## Make a website change

This is the everyday workflow for layouts, pages, styles, data, and documentation.

### 1. Start from the right branch

For independent work, branch from an up-to-date `main`:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/<short-name>
```

If the work intentionally builds on an open pull request, branch from that feature branch instead. State that dependency clearly in the new pull request.

### 2. Work locally

Run the development server while editing:

```bash
npm run dev
```

Check the affected page at mobile and desktop widths. For interaction or animation changes, also check keyboard use and reduced-motion behavior.

### 3. Validate before sharing

For a small change, start with a build:

```bash
npm run build
```

Before a pull request is ready to merge, run the complete local release gate:

```bash
npm run deploy
git status --short
git diff
```

`npm run deploy` can optimize images and refresh external-link favicons. Those steps may modify or remove tracked files, so always inspect the result and commit only the expected changes.

### 4. Open and review the pull request

```bash
git push -u origin feature/<short-name>
gh pr create --draft --base main
```

Cloudflare builds a preview for the branch. Find it in the pull request checks, open the Cloudflare Pages result, and review it before marking the pull request ready.

After approval, squash-merge the pull request. Cloudflare then builds production from `main`.

Finally, update your local `main`:

```bash
git switch main
git pull --ff-only origin main
```

### What `npm run deploy` actually does

Despite its name, this command never pushes, merges, or deploys:

```text
npm run deploy
  1. Optimize eligible images
  2. Audit every published article
  3. Check image rules
  4. Refresh and verify external-link favicons
  5. Build the complete static site
```

There is currently no GitHub Actions workflow. Cloudflare Pages provides the remote preview check and deploys production. Its production branch, build settings, and environment bindings live in the Cloudflare dashboard.

### Cloudflare previews and SEO

Cloudflare preview responses must include:

```text
X-Robots-Tag: noindex
```

Preview pages also keep canonical URLs pointing to `https://ludicrpg.com`. The header prevents indexing, while the canonical identifies the production URL. Together, they keep previews from competing with production as duplicate content.

If Cloudflare settings change, verify a preview response:

```bash
curl -I https://<preview-host>/<path>
```

Production must not return the preview `noindex` header.

## Create and publish an article

An article has a simple lifecycle:

```text
Create a post branch
  -> create the Markdown file and assets folder
  -> write with draft: true
  -> validate the draft
  -> open a draft pull request
  -> freeze and clean the media
  -> set draft: false for review
  -> inspect the PR preview
  -> squash-merge and publish
```

The Markdown file is the source of truth. Obsidian is a convenient editor, and Astro decides how the article appears on the website.

For a straightforward text article, the essential sections are branch and files, frontmatter, draft behavior, links, validation, and publication. Read the image, cover, YouTube, or Obsidian sections only when they apply.

### 1. Create the branch and files

Use one branch per article:

```bash
git switch main
git pull --ff-only origin main
git switch -c post/<article-slug>
```

Create the article under a year folder and a `MM-DD` folder:

```text
src/content/blog/
  2026/
    08-03/
      article-slug.md
      assets/
        cover.webp
        descriptive-inline-image.webp
```

The filename becomes the public slug. The source date does not appear in the URL:

```text
src/content/blog/2026/08-03/article-slug.md
https://ludicrpg.com/blog/article-slug/
```

The folder date must match `publishDate`.

### 2. Add the frontmatter

Start with:

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

Valid author combinations, defined in the [shared author registry](./src/lib/blog/authors.ts), are:

```yaml
authors: [ludo]
authors: [krayorn]
authors: [ludo, krayorn]
```

The author list controls the visible byline, author links, article cards, author archives, metadata, and `BlogPosting` JSON-LD. Keep the order you want displayed.

Required fields are `title`, `description`, `publishDate`, `authors`, `tags`, and `draft`. The description serves search and sharing metadata; the teaser is the shorter playful question shown on article cards. A cover and teaser are strongly expected.

### 3. Understand the two kinds of draft

They control different things:

- `draft: true` in frontmatter removes the article from the built site. There is no article page, card, RSS entry, sitemap entry, or preview route.
- A draft pull request exists on GitHub and Cloudflare, but is simply marked as not ready to merge.

Keep `draft: true` while the article is private. When Ludo or Krayorn needs to read the rendered article on a Cloudflare preview, set `draft: false` but keep the pull request itself in draft.

Preview SEO protections still apply.

### 4. Write the body and links

The layout creates the article's only H1 from `title`. Begin the body with `##`, and use `###` below it. Do not add another `#` heading in the Markdown.

Use public routes for internal links:

```markdown
[Another article](/blog/another-article/)
[A section in that article](/blog/another-article/#section-heading)
[The Alien RPG tag](/blog/tags/alien-rpg/)
[A section in this article](#section-heading)
```

Use a complete HTTPS URL for another website:

```markdown
[Krayorn's website](https://www.krayorn.com/)
```

External text links receive a locally cached favicon during the build. This is why a build can update `src/data/link-favicons.json` and files under `public/assets/link-icons/`.

Do not publish links to localhost, Cloudflare previews, source files, or Obsidian note paths.

### 5. Validate the draft

While `draft: true`, include drafts explicitly in the article check:

```bash
npm run blog:check -- <article-slug> --include-drafts
npm run build
```

Useful stricter checks are:

```bash
npm run blog:check -- <article-slug> --include-drafts --strict-assets
npm run blog:check -- <article-slug> --include-drafts --online
npm run blog:check -- <article-slug> --include-drafts --json
```

- `--strict-assets` treats unused article assets as critical.
- `--online` checks whether external URLs respond.
- `--json` returns machine-readable findings.

### 6. Open the draft pull request

Push the article branch and open its pull request when it is ready for collaborative review:

```bash
git push -u origin post/<article-slug>
gh pr create --draft --base main
```

With `draft: true`, Cloudflare can build the branch but cannot show an article route. When the rendered article is ready to review, set `draft: false`, commit the change, and push again. Keep the pull request itself in draft until the article is ready to publish.

### 7. Prepare and publish the article

Follow this order when the text and media are stable:

1. Freeze the article text and media set.
2. Rename generic imported images and update their Markdown references.
3. Refresh YouTube covers and inline posters when needed.
4. Set `draft: false` if it is not already visible on the preview.
5. Run the strict article check.
6. Run the complete local release gate.
7. Inspect and commit expected image or favicon changes.
8. Push and inspect the Cloudflare preview from the pull request checks.
9. Mark the pull request ready after review.
10. Squash-merge it into `main`, then pull the updated `main` locally.

```bash
npm run blog:check -- <article-slug> --strict-assets
npm run deploy
git status --short
git diff
git push
```

After the article is live, attach a Reddit link post to its on-site discussion counter with:

```bash
npm run blog:reddit -- https://www.reddit.com/r/ludicRPG/comments/...
```

This needs `LUDIC_REDDIT_DISCUSSION_ADMIN_TOKEN` locally. Cloudflare also needs the `REDDIT_DISCUSSIONS` KV binding and `REDDIT_DISCUSSION_ADMIN_TOKEN` secret. See [`.env.example`](./.env.example).

## Article authoring reference

The essential article workflow ends above. Use the following sections only for the editor or media involved in the article.

<details>
<summary><strong>Set up Obsidian for the blog</strong></summary>

<br>

Skip this section when you use another Markdown editor.

Open `src/content/blog/` as the Obsidian vault. Do not open the repository root as the blog vault.

The `.obsidian/` folder is ignored by Git, so each maintainer configures it locally:

1. In **Files & Links**, turn **Use Wikilinks** off.
2. Keep Markdown links on and enable automatic internal-link updates.
3. Set the base attachment folder to `assets`.
4. Install and enable the **Custom Attachment Location** community plugin.
5. Set its attachment folder to `${noteFolderPath}/assets`.
6. Set its Markdown URL format to `./assets/${generatedAttachmentFileName}`.
7. Optionally use `.obsidian/templates/blog-post.md` as the article template.

Dragging an image into an article should produce:

```text
2026/08-03/article-slug.md
2026/08-03/assets/pasted-image.png
```

```markdown
![Describe what a reader needs to understand](./assets/pasted-image.png)
```

Astro does not understand Obsidian-only syntax. Avoid:

```markdown
[[another article]]
![[image.png]]
```

Also remember:

- Obsidian callouts such as `> [!NOTE]` render as ordinary blockquotes with the marker visible.
- `![Description|697](./assets/image.webp)` does not resize an image. `|697` becomes part of its alt text.
- Astro component imports do not work because articles use `.md`, not MDX.
- Renaming an article changes its public URL. Search the repository for the old route before renaming a published article.

</details>

<details>
<summary><strong>Add images, pairs, carousels, and galleries</strong></summary>

<br>

Keep article-owned images in the article's `assets/` folder and use relative paths:

```markdown
![Motion tracker showing a detected signal](./assets/motion-tracker-signal.webp)
```

Alt text describes useful visual information. It is not a visible caption. Add a normal paragraph when the reader needs a visible explanation.

Image grouping depends on blank lines:

| Markdown group | Website result |
| --- | --- |
| One image in its own paragraph | Solo image |
| Exactly two images in one paragraph | Side-by-side pair on desktop, swipe carousel on mobile |
| Three or more images with no blank line between them | Gallery |

#### One image

```markdown
![A single table setup](./assets/table-setup.webp)
```

#### Two-image carousel

Keep both images in the same paragraph:

```markdown
![GM screen](./assets/gm-screen.webp) ![Player screen](./assets/player-screen.webp)
```

Desktop shows them side by side. Mobile uses a horizontal carousel with a dot indicator. Both images share one cropped frame, so keep important details away from the edges.

#### Gallery

Use three or more images without a blank line between them:

```markdown
![First prop](./assets/first-prop.webp)
![Second prop](./assets/second-prop.webp)
![Third prop](./assets/third-prop.webp)
```

Galleries stay as grids on mobile. Exactly six images use the dedicated three-by-two desktop layout and a two-column mobile layout.

To create two separate pairs, add a blank line between them:

```markdown
![First image](./assets/first.webp) ![Second image](./assets/second.webp)

![Third image](./assets/third.webp) ![Fourth image](./assets/fourth.webp)
```

Pair and gallery images join the lightbox automatically. A solo image opens only when the viewport can display it meaningfully larger.

Do not mix text, captions, or other elements into an image-group paragraph. A deliberately linked image works, but it does not join the automatic grouping or lightbox:

```markdown
[![Screenshot of a Reddit post](./assets/reddit-post.webp)](https://www.reddit.com/)
```

For implementation details, see [the image groups and lightbox specification](./docs/blog-image-groups-and-lightbox-spec.md).

</details>

<details>
<summary><strong>Choose the article and social covers</strong></summary>

<br>

`coverImage` is the visible cover:

```yaml
coverImage: "./assets/cover.webp"
```

The same image appears in the article header and article cards. It also becomes the default Open Graph, Twitter, and structured-data image.

Use a large landscape WebP close to `2:1`. Keep important content away from the edges because the article header crops to `2:1`, cards use `16:9`, and small-screen cards can reach `21:9`.

When sharing needs a different composition, add an optional social image:

```yaml
socialImage: "./assets/article-social.jpg"
socialImageAlt: "The article's main subjects composed for a wide sharing card"
```

This replaces the image only in sharing and structured metadata. The visible article still uses `coverImage`. A `1200 x 630` composition is a good social target.

Keep covers inside the article assets folder. The optimizer automatically converts generic `cover.png`, `cover.jpg`, and `cover.jpeg` files to `cover.webp`. It does not automatically convert descriptively named covers or arbitrary inline images.

</details>

<details>
<summary><strong>Use YouTube covers and inline videos</strong></summary>

<br>

For a video-backed article cover, add:

```yaml
videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"
videoTitle: "Accessible video title"
videoDescription: "What the video shows and why it matters"
videoUploadDate: 2026-08-03
videoDuration: "PT2M30S"
coverImage: "./assets/cover.webp"
```

With `videoUrl`, the cover and video title, description, and upload date are required. Duration is optional but recommended.

The page first displays the local cover. It loads the privacy-enhanced YouTube player only after a click. These frontmatter fields also generate `VideoObject` JSON-LD.

Refresh the local cover from YouTube:

```bash
npm run video:covers -- --only=<article-slug> --dry-run
npm run video:covers -- --only=<article-slug>
```

Use `--force` when the configured cover does not exist or an existing poster must be replaced:

```bash
npm run video:covers -- --only=<article-slug> --force
```

For an inline YouTube video, use an external image embed on its own line:

```markdown
![Motion tracker table test](https://www.youtube.com/watch?v=VIDEO_ID)
```

Then run the cover command. It creates:

```text
./assets/youtube-VIDEO_ID.webp
```

The website replaces the Markdown image with a lightweight local facade. The built page must not contact YouTube for a thumbnail or iframe before the reader clicks.

Only the frontmatter `videoUrl` creates `VideoObject` JSON-LD. Inline videos do not currently create additional video structured data.

</details>

## Change the homepage featured articles

Homepage features are curated. They do not automatically use the newest articles.

Edit [`src/data/homeFeaturedArticles.ts`](./src/data/homeFeaturedArticles.ts). The same data drives the visible homepage and its JSON-LD, so they stay aligned.

### Feature a Ludic article on Ludo's side

Set its exact public slug:

```ts
export const HOME_FEATURED_LUDO_SLUG = 'article-slug';
```

The title, teaser or description, image, date, authors, URL, and structured data come from the article frontmatter. The article must exist and have `draft: false`. A missing, renamed, or draft article disappears from both the homepage and its JSON-LD.

### Feature an external article on Krayorn's side

Update every field together:

```ts
export const HOME_FEATURED_KRAYORN = {
  title: 'Visible article title',
  schemaHeadline: 'Canonical article headline',
  description: 'Short article description.',
  url: 'https://www.krayorn.com/posts/article/',
} as const;
```

`title` is the text fitted to the homepage bubble. `schemaHeadline` is the article's complete canonical headline and should match the source article even when the visible title is shortened.

The current model expects an internal Ludic article on Ludo's side and an external article on Krayorn's side. Featuring an internal Krayorn article or an external Ludo article requires a code change in the homepage component and schema consumer.

After changing a feature:

1. Check the homepage on mobile and desktop.
2. Check the title, avatar, speech-bubble pointer, hover state, and link.
3. Run a build.
4. Confirm the homepage `ItemList`, the search-engine list of featured links, matches what is visible.

## Work with SEO and JSON-LD

Most changes should not require handwritten JSON-LD. Shared builders derive metadata from the same content shown on the page.

For example, adding `authors: [ludo, krayorn]` to an article feeds the visible byline, author pages, metadata, and `BlogPosting` author entities. Changing the homepage feature data updates both the visible feature and its `ItemList`.

### Sources of truth

| File | What it controls |
| --- | --- |
| [`src/layouts/BaseLayout.astro`](./src/layouts/BaseLayout.astro) | Title, description, canonical, robots, Open Graph, Twitter, RSS discovery, and final JSON-LD graph |
| [`src/lib/seo/constants.ts`](./src/lib/seo/constants.ts) | Production URL, brand data, and stable entity IDs |
| [`src/lib/seo/jsonLd.ts`](./src/lib/seo/jsonLd.ts) | Builders for the organization, people, pages, articles, videos, lists, and breadcrumbs |
| [`src/lib/blog/authors.ts`](./src/lib/blog/authors.ts) | Author IDs, names, profiles, avatars, archives, and Person references |
| [`src/layouts/BlogPostLayout.astro`](./src/layouts/BlogPostLayout.astro) | Article bylines, metadata, `BlogPosting`, `VideoObject`, and breadcrumbs |

Every normal page graph contains the Ludic RPG `Organization`, Ludo and Krayorn as `Person` entities, the `WebSite`, and the current page. A route can add entities such as `BlogPosting`, `VideoObject`, `BreadcrumbList`, `ItemList`, `CollectionPage`, `ProfilePage`, or `AboutPage`.

### Rules to preserve

- Use absolute production URLs on `https://ludicrpg.com` in canonical and schema data.
- Never put localhost or preview hosts into published metadata.
- Keep stable `@id` values in `ENTITY_IDS`.
- Reuse the existing Ludic RPG, Ludo, Krayorn, and website entities.
- Keep structured data consistent with visible titles, people, images, links, and lists.
- Add article authors through the frontmatter array and shared author registry.
- Resolve article-owned images through [`resolveBlogAsset`](./src/lib/blog/posts.ts) before adding them to metadata.
- Build collection `ItemList` data from the same articles the route displays.
- Keep homepage feature schema derived from the shared feature configuration.
- Give video-backed articles complete video frontmatter.

### Validate metadata

1. Run `npm run build`.
2. Open the generated page in `dist/<route>/index.html`.
3. Confirm there is one coherent `application/ld+json` graph.
4. Compare its title, description, authors, images, date, and links with the visible page.
5. Test a public or preview URL with the [Schema.org validator](https://validator.schema.org/).
6. For eligible articles and videos, also use [Google's Rich Results Test](https://search.google.com/test/rich-results).

Quick local inspection:

```bash
rg -n 'application/ld\+json|canonical|og:title|twitter:title' dist/<route>/index.html
```

## Check performance

Performance targets protect the reader experience. They are team goals, not currently enforced by CI.

### Core Web Vitals

At the 75th percentile on mobile and desktop:

| Metric | Target |
| --- | --- |
| Largest Contentful Paint (LCP) | `<= 2.5 s` |
| Interaction to Next Paint (INP) | `<= 200 ms` |
| Cumulative Layout Shift (CLS) | `<= 0.1` |

Field data matters more than a perfect local score because it represents real visitors, devices, and connections. These thresholds follow [Google's Core Web Vitals guidance](https://web.dev/articles/vitals).

### Manual release check

Run Lighthouse when a change affects layout, navigation, media, fonts, client-side JavaScript, or another performance-sensitive public surface. It is not necessary for a documentation-only change.

Run mobile Lighthouse on:

- `/`
- `/blog/`
- `/about/`
- at least one media-rich article

Aim for `90` or higher in Performance, Accessibility, Best Practices, and SEO, with no unexplained regression. This check is manual today. There is no committed Lighthouse workflow, page-weight budget, or JavaScript bundle budget.

### Everyday guardrails

- Prefer WebP for public raster images and article covers.
- Give images dimensions or a stable aspect ratio to prevent layout shifts.
- Lazy-load media below the fold.
- Reserve eager loading and high fetch priority for the page's LCP image.
- Keep YouTube and iframe loading behind a local poster and user action.
- Avoid new client-side JavaScript and dependencies unless the reader benefit justifies them.
- Test mobile and reduced-motion behavior.
- Run `npm run deploy` before merge.

`assets:optimize` covers eligible files in `public/assets/img/` and generic article covers named `cover.png`, `cover.jpg`, or `cover.jpeg`. Prepare other inline images as WebP before committing when practical.

## Command reference

Use this section when you know the task and only need the command.

### Development and release

| Command | Purpose | Can change tracked files? |
| --- | --- | --- |
| `npm run dev` | Start the Astro development server | No |
| `npm run build` | Run prebuild checks and create `dist/` | Yes, favicon files can change |
| `npm run preview` | Serve the existing production build locally | No |
| `npm run deploy` | Run the complete local release gate | Yes |

### Articles and assets

| Command | Purpose | Can change tracked files? |
| --- | --- | --- |
| `npm run blog:check -- <slug>` | Audit one published article | No |
| `npm run blog:check -- <slug> --include-drafts` | Audit one article that still has `draft: true` | No |
| `npm run blog:check -- --all` | Audit all published articles | No |
| `npm run blog:check -- --all --include-drafts` | Audit every article | No |
| `npm run assets:check` | Check image rules without conversion | No |
| `npm run assets:optimize` | Convert eligible rasters, update matching source and article frontmatter references, and remove replaced files | Yes |
| `npm run video:covers -- --only=<slug>` | Refresh local YouTube covers and inline posters | Yes |
| `npm run links:favicons` | Refresh cached icons for external Markdown links | Yes |
| `npm run links:favicons:check` | Verify the external-link icon cache | No |
| `npm run blog:reddit -- <reddit-url>` | Attach a Reddit discussion to a published article | External state only |

### What the repository scripts own

| Script | Responsibility |
| --- | --- |
| [`scripts/assets.mjs`](./scripts/assets.mjs) | Image checks, conversion, and matching source or article frontmatter reference updates |
| [`scripts/blog-check.mjs`](./scripts/blog-check.mjs) | Article structure, frontmatter, authors, links, and local media |
| [`scripts/refresh-youtube-covers.mjs`](./scripts/refresh-youtube-covers.mjs) | Local WebP covers and inline facade posters from YouTube thumbnails |
| [`scripts/refresh-link-favicons.mjs`](./scripts/refresh-link-favicons.mjs) | Local favicon cache for external Markdown links |
| [`scripts/set-reddit-discussion.mjs`](./scripts/set-reddit-discussion.mjs) | Protected Cloudflare request that associates a Reddit discussion with an article |

## Optional Codex helpers

These personal skills wrap parts of the same workflow. They are conveniences, not repository requirements, and may need separate installation for each maintainer.

| Skill | Use it when | What it helps with |
| --- | --- | --- |
| `ludic-home-deploy` | Preparing or completing a website release | Branch scope, release checks, generated changes, PR flow, merge, and post-merge cleanup |
| `blog-release-asset-cleanup` | Article text and media are frozen | Meaningful asset names, updated Markdown references, and article validation |
| `ludic-youtube-cover-refresh` | A video-backed article needs a fresh poster | Local YouTube covers, build validation, and runtime privacy checks |

The npm commands and this README remain the shared source of truth when a skill is unavailable.
