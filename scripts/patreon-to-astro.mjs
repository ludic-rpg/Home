#!/usr/bin/env node
/**
 * Convert exported Patreon posts into Astro content collection markdown.
 *
 * Reads:  ../patreon-export/<id>.json   (produced by scripts/patreon-export.mjs)
 * Writes: ../src/content/blog/<slug>.md
 *         ../patreon-export/_image-manifest.json   (orig URL -> local filename)
 *
 * Image files themselves are NOT downloaded by this script (the conversion
 * sandbox can't reach the Patreon CDN). After this runs, use the companion
 * scripts/patreon-images.mjs (or `bash patreon-export/_image-download.sh`) on
 * your local machine to fetch them into public/assets/img/blog/.
 *
 * Run from project root:
 *   node scripts/patreon-to-astro.mjs
 *   node scripts/patreon-to-astro.mjs --dry-run     # preview, write nothing
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, basename } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const EXPORT_DIR = resolve(ROOT, 'patreon-export');
const BLOG_DIR = resolve(ROOT, 'src', 'content', 'blog');
const IMG_DIR_REL = '/assets/img/blog'; // public path used in <img src=...>
const ARGS = new Set(process.argv.slice(2));
const DRY = ARGS.has('--dry-run');

// ---------------------------------------------------------------------------
// Tag inference (scored, capped at 4 tags)
// ---------------------------------------------------------------------------
// Score = title_matches * 3 + body_matches * 1.
// `threshold` is per-rule because flagship products (ludic-field, motion-tracker)
// deserve a single-mention fire, while generic words ("campaign", "rpg") need
// more support to avoid false positives.
const TAG_RULES = [
  // Game systems: need a clear phrase match
  { tag: 'alien-rpg', re: /\balien rpg\b|xenomorph|weyland|nostromo|ripley|heart of darkness/gi, threshold: 2 },
  { tag: 'cops-rpg', re: /\bc\.o\.p\.s\b|police rpg/gi, threshold: 2 },
  // Flagship products: single mention fires
  { tag: 'ludic-field', re: /ludic field|ludic architect|airshaft|novgorod|tomokazu|map editor|map viewer/gi, threshold: 1 },
  { tag: 'alien-motion-tracker', re: /motion tracker/gi, threshold: 1 },
  // Thematic: need corroboration
  { tag: 'release-notes', re: /\brelease\b|\bv\d+\.\d+|version \d/gi, threshold: 2 },
  { tag: 'ttrpg-campaign', re: /campaign|playtest|gm['’]?ing|game master/gi, threshold: 3 },
  { tag: 'behind-the-scenes', re: /behind the scenes|post[- ]mortem|retrospective|lessons learned/gi, threshold: 2 },
  { tag: 'dev-log', re: /typescript|refactor|rewrite|rebuild|architecture|engine|codebase|prototype/gi, threshold: 2 },
  { tag: 'gm-tools', re: /gm['’]?s?\b|game master|smart light|audio automation|prop\b/gi, threshold: 3 },
  // SEO map tags: broad enough to catch most map-themed posts. Hand-tune in
  // the markdown after conversion if you want a tighter set.
  { tag: 'ttrpg-map', re: /map viewer|map editor|tabletop map|ttrpg map|ludic field/gi, threshold: 1 },
  { tag: 'sci-fi-rpg-map', re: /\balien rpg\b|xenomorph|starship|station|sci[- ]?fi/gi, threshold: 2 },
  { tag: 'futuristic-map', re: /futuristic|sci[- ]?fi|space station|alien rpg/gi, threshold: 2 },
];

function inferTags(title, plainText) {
  const scored = [];
  for (const { tag, re, threshold } of TAG_RULES) {
    const titleMatches = (title.match(re) || []).length;
    const bodyMatches = (plainText.match(re) || []).length;
    const score = titleMatches * 3 + bodyMatches;
    if (score >= threshold) scored.push({ tag, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 4).map((x) => x.tag);
  if (top.length === 0) top.push('blog');
  return top;
}

// ---------------------------------------------------------------------------
// Slug + filename helpers
// ---------------------------------------------------------------------------
function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const ext = extname(u.pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return ext;
  } catch {}
  return '.jpg'; // sensible default for Patreon CDN
}

// ---------------------------------------------------------------------------
// HTML → Markdown (focused on the subset Patreon emits)
// ---------------------------------------------------------------------------
function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '…');
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/**
 * Strip tags while preserving block boundaries as spaces, so adjacent
 * paragraph text doesn't run together (e.g. "justice.I grew up" → "justice. I grew up").
 */
function plainTextFromHtml(html) {
  let s = html.replace(/<\/(p|div|li|h[1-6]|blockquote|ul|ol)>/gi, ' ');
  s = s.replace(/<br\s*\/?>/gi, ' ');
  return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

/**
 * Convert inline-level HTML to inline markdown.
 * Block-level structure is handled in htmlToMarkdown below.
 */
function inlineToMd(html, ctx) {
  let s = html;

  // Patreon sometimes emits empty <strong><br/></strong> "decorative" spacing
  // that turns into orphan `**` after conversion. Strip those, and merge
  // adjacent same-emphasis tags so "<strong>A</strong><strong>B</strong>"
  // becomes a single bold span.
  s = s.replace(/<(strong|b|em|i|u)>\s*(<br\s*\/?>\s*)*<\/\1>/gi, '');
  s = s.replace(/<\/(strong|b|em|i|u)>\s*<\1>/gi, '');

  // <br/> → soft line break
  s = s.replace(/<br\s*\/?>/gi, '\n');

  // Anchors. Detect YouTube and queue a YouTube embed replacement at block level.
  s = s.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
    const ytId = extractYouTubeId(href);
    if (ytId) {
      // Mark with a placeholder we'll convert to <YouTube ... /> at block level
      // The placeholder is on its own line so the block step can find it.
      ctx.youtubeIds.add(ytId);
      const labelText = stripTags(label) || `YouTube video ${ytId}`;
      return `@@YT::${ytId}::${labelText.replace(/::/g, ':')}@@`;
    }
    const text = stripTags(label) || href;
    return `[${text}](${href})`;
  });

  // Images: collect URL (decode HTML entities so &amp; etc. don't break curl
  // when we later download), swap to local path.
  s = s.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (_, src) => {
    const cleanUrl = decodeEntities(src);
    const local = ctx.registerImage(cleanUrl);
    return `![${ctx.altFor(local)}](${local})`;
  });

  // Bold / italic / underline (underline → bold-ish, markdown has no underline)
  s = s.replace(/<\s*strong[^>]*>([\s\S]*?)<\s*\/\s*strong\s*>/gi, '**$1**');
  s = s.replace(/<\s*b[^>]*>([\s\S]*?)<\s*\/\s*b\s*>/gi, '**$1**');
  s = s.replace(/<\s*em[^>]*>([\s\S]*?)<\s*\/\s*em\s*>/gi, '*$1*');
  s = s.replace(/<\s*i[^>]*>([\s\S]*?)<\s*\/\s*i\s*>/gi, '*$1*');
  s = s.replace(/<\s*u[^>]*>([\s\S]*?)<\s*\/\s*u\s*>/gi, '**$1**');
  s = s.replace(/<\s*code[^>]*>([\s\S]*?)<\s*\/\s*code\s*>/gi, '`$1`');

  // Clean up redundant bold inside bold ("**foo** **bar**" stays, but
  // "**foo****bar**" merges)
  s = s.replace(/\*\*\*\*/g, '');

  // Strip any leftover spans / divs at inline level
  s = s.replace(/<\s*\/?\s*(span|div|section|article|figure|figcaption)[^>]*>/gi, '');

  return decodeEntities(s);
}

function extractYouTubeId(url) {
  const m1 = url.match(/(?:youtube\.com\/watch\?[^"]*[?&]?v=)([A-Za-z0-9_-]{6,})/);
  if (m1) return m1[1];
  const m2 = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (m2) return m2[1];
  const m3 = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  if (m3) return m3[1];
  return null;
}

function htmlToMarkdown(html, ctx) {
  // Normalize whitespace
  let s = html.replace(/\r\n?/g, '\n');

  const out = [];

  // Tokenize block-level elements with a recursive-ish scan. Patreon's HTML is
  // flat enough that a sequence of top-level open tags works.
  // Strategy: replace block tags with placeholders, then split.
  const blockRe = /<(p|h[1-6]|ul|ol|blockquote|div)([^>]*)>([\s\S]*?)<\/\1>/gi;

  let cursor = 0;
  let m;
  while ((m = blockRe.exec(s)) !== null) {
    if (m.index > cursor) {
      const stray = s.slice(cursor, m.index).trim();
      if (stray && !/^<\/?(br)\s*\/?>$/i.test(stray)) {
        const md = inlineToMd(stray, ctx).trim();
        if (md) out.push(md);
      }
    }
    cursor = m.index + m[0].length;

    const tag = m[1].toLowerCase();
    const inner = m[3];

    if (tag === 'p') {
      // Faux-heading promotion: Patreon often writes a sub-heading as
      //   <p><br/><strong>Short Label</strong><strong><br/></strong>Body…</p>
      // Normalize leading <br/> and empty emphasis wrappers before matching.
      let pInner = inner
        .replace(/^\s*(<br\s*\/?>\s*)+/i, '')
        .replace(/<(strong|b|em|i|u)>\s*(<br\s*\/?>\s*)*<\/\1>/gi, '');
      const fh = pInner.match(/^\s*<strong>([^<]{1,60})<\/strong>\s*(<br\s*\/?>\s*)?([\s\S]+)$/);
      if (
        fh &&
        !/[.!?]\s*$/.test(fh[1].trim()) &&
        stripTags(fh[3]).length > 40
      ) {
        out.push(`### ${stripTags(fh[1])}`);
        const restMd = inlineToMd(fh[3], ctx).trim();
        if (restMd) out.push(restMd);
      } else {
        const md = inlineToMd(inner, ctx).trim();
        if (md && md !== '**') out.push(md);
      }
    } else if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag.slice(1));
      // Strip ALL emphasis from heading content - markdown headings don't need bold
      let text = inlineToMd(inner, ctx).trim();
      text = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (text) out.push(`${'#'.repeat(level)} ${text}`);
    } else if (tag === 'blockquote') {
      // Recurse through block-level processing so inner <p> tags get stripped
      // and structure is preserved, then prefix every line with `> `.
      const innerMd = htmlToMarkdown(inner, ctx).trim();
      if (innerMd) {
        const quoted = innerMd
          .split('\n')
          .map((l) => (l.trim() === '' ? '>' : `> ${l}`))
          .join('\n');
        out.push(quoted);
      }
    } else if (tag === 'ul' || tag === 'ol') {
      const items = [];
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liM;
      let i = 1;
      while ((liM = liRe.exec(inner)) !== null) {
        let liHtml = liM[1];
        // strip wrapping <p> tags inside <li>
        liHtml = liHtml.replace(/^\s*<p[^>]*>/i, '').replace(/<\/p>\s*$/i, '');
        liHtml = liHtml.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
        const liMd = inlineToMd(liHtml, ctx).trim();
        if (!liMd) continue;
        const bullet = tag === 'ol' ? `${i}.` : '-';
        items.push(`${bullet} ${liMd.replace(/\n/g, '\n  ')}`);
        i += 1;
      }
      if (items.length) out.push(items.join('\n'));
    } else if (tag === 'div') {
      // div is usually just an image wrapper; recurse
      const md = htmlToMarkdown(inner, ctx).trim();
      if (md) out.push(md);
    }
  }
  if (cursor < s.length) {
    const trail = s.slice(cursor).trim();
    if (trail) {
      const md = inlineToMd(trail, ctx).trim();
      if (md) out.push(md);
    }
  }

  // Convert YouTube placeholders back to <YouTube /> JSX. The .mdx wrapper +
  // import line at the top of the file lets Astro process this component.
  let joined = out.join('\n\n');
  joined = joined.replace(/@@YT::([A-Za-z0-9_-]+)::([^@]+)@@/g, (_, id, label) => {
    const cleanLabel = label.trim().replace(/"/g, '\\"');
    return `\n<YouTube id="${id}" title="${cleanLabel}" />\n`;
  });

  // Collapse runs of 3+ blank lines to a clean double newline
  joined = joined.replace(/\n{3,}/g, '\n\n').trim();
  return joined;
}

// ---------------------------------------------------------------------------
// Per-post conversion
// ---------------------------------------------------------------------------
function buildFrontmatter({ title, description, publishDate, coverImage, tags }) {
  const lines = ['---'];
  lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
  lines.push(`description: "${description.replace(/"/g, '\\"')}"`);
  lines.push(`publishDate: ${publishDate}`);
  if (coverImage) lines.push(`coverImage: "${coverImage}"`);
  lines.push(`tags: [${tags.map((t) => `"${t}"`).join(', ')}]`);
  lines.push('draft: false');
  lines.push('---');
  return lines.join('\n');
}

function makeDescription(plain) {
  // First sentence or first 200 chars, whichever is shorter.
  const trimmed = plain.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const dot = trimmed.indexOf('. ');
  let d = dot > 40 && dot < 200 ? trimmed.slice(0, dot + 1) : trimmed.slice(0, 197) + '…';
  // Strip trailing ellipsis if we already ended on punctuation
  d = d.replace(/…\.+$/, '…');
  return d;
}

function convertPost(json) {
  const attrs = json.attributes || {};
  const title = attrs.title || `Untitled ${json.id}`;
  const html = attrs.content || '';
  const slug = slugify(title);
  const publishDate = attrs.published_at
    ? attrs.published_at.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  // Image registry per post
  let imgSeq = 0;
  const imageMap = []; // [{ originalUrl, localPath, filename }]
  const ctx = {
    youtubeIds: new Set(),
    registerImage(originalUrl) {
      imgSeq += 1;
      const ext = extFromUrl(originalUrl);
      const filename = `${slug}-${imgSeq}${ext}`;
      const localPath = `${IMG_DIR_REL}/${filename}`;
      imageMap.push({ originalUrl, localPath, filename });
      return localPath;
    },
    altFor(localPath) {
      return basename(localPath, extname(localPath)).replace(/-/g, ' ');
    },
  };

  const md = htmlToMarkdown(html, ctx);
  const plain = plainTextFromHtml(html);
  const description = makeDescription(plain);
  const tags = inferTags(title, plain);
  const coverImage = imageMap[0]?.localPath; // first image becomes cover

  const ytImport = ctx.youtubeIds.size
    ? `\nimport YouTube from '../../components/YouTube.astro';\n`
    : '';
  const fm = buildFrontmatter({ title, description, publishDate, coverImage, tags });
  const body = `${fm}\n${ytImport}\n${md}\n`;

  // Filename gets a YY-MM-DD_ prefix for chronological sorting in Obsidian.
  // The URL slug strips this prefix at the route level; see src/pages/blog/[...slug].astro.
  // Posts that embed JSX components (the YouTube wrapper) need .mdx so Astro
  // processes the import. To see .mdx files in Obsidian, install the
  // "Custom File Extensions Plugin" by elias-sundqvist and add `mdx` to it.
  const datePrefix = publishDate.slice(2).replace(/-/g, '-'); // 2026-02-04 -> 26-02-04
  const ext = ctx.youtubeIds.size ? '.mdx' : '.md';
  const filename = `${datePrefix}_${slug}${ext}`;

  return {
    slug,
    filename,
    body,
    imageMap,
    youtubeIds: [...ctx.youtubeIds],
    publishDate,
    tags,
    title,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const files = (await readdir(EXPORT_DIR)).filter(
    (f) => f.endsWith('.json') && !f.startsWith('_'),
  );
  if (!files.length) {
    console.error(`No post JSON files in ${EXPORT_DIR}. Run scripts/patreon-export.mjs first.`);
    process.exit(1);
  }

  console.log(`Converting ${files.length} posts…`);
  if (!DRY) await mkdir(BLOG_DIR, { recursive: true });

  // Preserve hand-edited description / tags on re-run. If a file with the
  // same filename already exists, pull its description and tags out of the
  // frontmatter and re-use them instead of regenerating from content.
  async function readExistingFrontmatter(dest) {
    try {
      const existing = await readFile(dest, 'utf8');
      const fmMatch = existing.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) return null;
      const fm = fmMatch[1];
      const descMatch = fm.match(/^description:\s*"((?:[^"\\]|\\.)*)"/m);
      const tagsMatch = fm.match(/^tags:\s*(\[.*\])/m);
      return {
        description: descMatch ? descMatch[1].replace(/\\"/g, '"') : null,
        tags: tagsMatch ? JSON.parse(tagsMatch[1]) : null,
      };
    } catch {
      return null;
    }
  }

  const allImages = [];
  const summary = [];
  for (const f of files.sort()) {
    const raw = await readFile(resolve(EXPORT_DIR, f), 'utf8');
    const json = JSON.parse(raw);
    const result = convertPost(json);
    // Merge in hand edits before writing
    const dest = resolve(BLOG_DIR, result.filename);
    const existing = DRY ? null : await readExistingFrontmatter(dest);
    if (existing?.description) {
      result.body = result.body.replace(
        /^description:\s*"[^"]*"/m,
        `description: "${existing.description.replace(/"/g, '\\"')}"`,
      );
    }
    if (existing?.tags?.length) {
      result.body = result.body.replace(
        /^tags:\s*\[.*\]/m,
        `tags: [${existing.tags.map((t) => `"${t}"`).join(', ')}]`,
      );
      result.tags = existing.tags;
    }
    summary.push({
      id: json.id,
      title: result.title,
      slug: result.slug,
      publishDate: result.publishDate,
      tags: result.tags,
      images: result.imageMap.length,
      youtube: result.youtubeIds.length,
    });
    for (const img of result.imageMap) {
      allImages.push({ postId: json.id, slug: result.slug, ...img });
    }
    if (DRY) {
      console.log(`  [dry-run] would write ${dest}`);
    } else {
      await writeFile(dest, result.body, 'utf8');
      console.log(`  wrote ${result.filename}  (tags: ${result.tags.join(', ')}, images: ${result.imageMap.length}, yt: ${result.youtubeIds.length})`);
    }
  }

  // Image manifest + downloadable shell script
  if (!DRY) {
    await writeFile(
      resolve(EXPORT_DIR, '_image-manifest.json'),
      JSON.stringify(allImages, null, 2),
      'utf8',
    );
    const shLines = [
      '#!/usr/bin/env bash',
      'set -euo pipefail',
      'cd "$(dirname "$0")/.."',
      'mkdir -p public/assets/img/blog',
    ];
    for (const img of allImages) {
      const escUrl = img.originalUrl.replace(/"/g, '\\"');
      shLines.push(`curl -L --fail --silent --show-error -o "public/assets/img/blog/${img.filename}" "${escUrl}"`);
    }
    shLines.push(`echo "Downloaded ${allImages.length} images to public/assets/img/blog/"`);
    await writeFile(resolve(EXPORT_DIR, '_image-download.sh'), shLines.join('\n') + '\n', { mode: 0o755 });
    await writeFile(resolve(EXPORT_DIR, '_conversion-summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  }

  console.log(`\nTotal images referenced: ${allImages.length}`);
  console.log(`Summary: ${EXPORT_DIR}/_conversion-summary.json`);
  console.log(`Image manifest: ${EXPORT_DIR}/_image-manifest.json`);
  console.log(`Run: bash ${EXPORT_DIR}/_image-download.sh   (on your local machine, where Patreon CDN is reachable)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
