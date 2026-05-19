#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const blogDir = path.join(rootDir, 'src/content/blog');
const publicDir = path.join(rootDir, 'public');
const blogAssetsDir = path.join(publicDir, 'assets/img/blog');
const datePrefixPattern = /^\d{2}-\d{2}-\d{2}_/;
const articleExtensionPattern = /\.(md|mdx)$/;

const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  includeDrafts: args.includes('--include-drafts'),
  json: args.includes('--json'),
  online: args.includes('--online'),
};
const targets = args.filter((arg) => !arg.startsWith('--'));

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (!options.all && targets.length !== 1) {
    printUsage();
    process.exit(1);
  }

  const articleFiles = options.all
    ? getAllArticleFiles()
    : [resolveArticleFile(targets[0])];

  const reports = [];
  for (const filePath of articleFiles) {
    reports.push(await checkArticle(filePath));
  }

  if (options.json) {
    console.log(JSON.stringify(reports, null, 2));
  } else {
    printReports(reports);
  }

  const hasCritical = reports.some((report) => report.findings.some((finding) => finding.severity === 'Critical'));
  process.exit(hasCritical ? 1 : 0);
}

function printUsage() {
  console.error(`Usage:
  npm run blog:check -- <slug|file>
  npm run blog:check -- --all

Optional flags:
  --online   Check external links with HTTP requests
  --include-drafts
             Include draft posts in --all
  --json     Print machine-readable JSON`);
}

function getAllArticleFiles() {
  return fs
    .readdirSync(blogDir)
    .filter((name) => articleExtensionPattern.test(name))
    .filter((name) => !name.startsWith('_'))
    .map((name) => path.join(blogDir, name))
    .filter((filePath) => options.includeDrafts || !isDraftArticle(filePath))
    .sort();
}

function isDraftArticle(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const { frontmatter } = parseFrontmatter(source);
  return frontmatter.draft === true;
}

function resolveArticleFile(target) {
  const normalizedTarget = target.replace(/^\/blog\//, '').replace(/\/$/, '');
  const directPath = path.resolve(rootDir, normalizedTarget);
  if (fs.existsSync(directPath) && articleExtensionPattern.test(directPath)) {
    return directPath;
  }

  const blogRelativePath = path.resolve(blogDir, normalizedTarget);
  if (fs.existsSync(blogRelativePath) && articleExtensionPattern.test(blogRelativePath)) {
    return blogRelativePath;
  }

  const targetSlug = getPublicSlug(normalizedTarget.replace(articleExtensionPattern, ''));
  const match = getAllArticleFiles().find((filePath) => getPublicSlug(path.basename(filePath, path.extname(filePath))) === targetSlug);
  if (match) return match;

  throw new Error(`Could not find blog article for "${target}".`);
}

async function checkArticle(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const extension = path.extname(filePath);
  const fileName = path.basename(filePath, extension);
  const slug = getPublicSlug(fileName);
  const assetFolder = path.join(blogAssetsDir, slug);
  const { frontmatter, body, frontmatterEndLine } = parseFrontmatter(source);
  const findings = [];
  const referencedPublicPaths = new Set();

  const addFinding = (severity, message, detail = {}) => {
    findings.push({ severity, message, ...detail });
  };

  checkFrontmatter({ addFinding, filePath, frontmatter, referencedPublicPaths, slug });
  checkMarkdown({ addFinding, body, frontmatterEndLine, referencedPublicPaths, slug });
  await checkExternalReachability({ addFinding, body, frontmatter });
  checkAssetFolder({ addFinding, assetFolder, referencedPublicPaths, slug });

  return {
    file: path.relative(rootDir, filePath),
    slug,
    url: `/blog/${slug}/`,
    assetFolder: path.relative(rootDir, assetFolder),
    counts: countFindings(findings),
    findings,
  };
}

function getPublicSlug(fileName) {
  return fileName.replace(datePrefixPattern, '');
}

function parseFrontmatter(source) {
  if (!source.startsWith('---\n')) {
    return { frontmatter: {}, body: source, frontmatterEndLine: 0 };
  }

  const endIndex = source.indexOf('\n---', 4);
  if (endIndex === -1) {
    return { frontmatter: {}, body: source, frontmatterEndLine: 0 };
  }

  const rawFrontmatter = source.slice(4, endIndex);
  const bodyStart = source.indexOf('\n', endIndex + 4) + 1;
  const body = source.slice(bodyStart);
  const frontmatterEndLine = source.slice(0, bodyStart).split('\n').length - 1;
  return {
    frontmatter: parseYamlSubset(rawFrontmatter),
    body,
    frontmatterEndLine,
  };
}

function parseYamlSubset(raw) {
  const data = {};
  let currentArrayKey = null;
  for (const line of raw.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;

    const arrayItemMatch = line.match(/^\s+-\s*(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      data[currentArrayKey].push(parseYamlValue(arrayItemMatch[1]));
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      currentArrayKey = null;
      continue;
    }

    const [, key, rawValue] = match;
    if (rawValue.trim() === '') {
      data[key] = [];
      currentArrayKey = key;
    } else {
      data[key] = parseYamlValue(rawValue);
      currentArrayKey = null;
    }
  }
  return data;
}

function parseYamlValue(rawValue) {
  const value = rawValue.trim();
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => parseYamlValue(item))
      .filter((item) => item !== '');
  }
  return value;
}

function checkFrontmatter({ addFinding, filePath, frontmatter, referencedPublicPaths, slug }) {
  const requiredFields = ['title', 'description', 'publishDate', 'tags', 'draft'];
  for (const field of requiredFields) {
    if (!(field in frontmatter) || frontmatter[field] === '') {
      addFinding('Critical', `Missing required frontmatter field: ${field}`, { field });
    }
  }

  if ('draft' in frontmatter && typeof frontmatter.draft !== 'boolean') {
    addFinding('Critical', '`draft` must be true or false', { field: 'draft' });
  }

  if ('tags' in frontmatter && !Array.isArray(frontmatter.tags)) {
    addFinding('Critical', '`tags` must be a YAML array', { field: 'tags' });
  }

  if (isPlaceholder(frontmatter.title)) {
    addFinding('Critical', '`title` is empty or placeholder text', { field: 'title' });
  }

  if (isPlaceholder(frontmatter.description)) {
    addFinding('Critical', '`description` is empty or placeholder text', { field: 'description' });
  }

  if (!frontmatter.coverImage) {
    addFinding('Important', 'Missing `coverImage`; article cards, Open Graph, and BlogPosting image will be weaker', {
      field: 'coverImage',
    });
  } else {
    checkPublicAssetPath({
      addFinding,
      pathValue: frontmatter.coverImage,
      referencedPublicPaths,
      severity: 'Critical',
      slug,
      source: 'coverImage',
    });
  }

  if (!frontmatter.teaser) {
    addFinding('Important', 'Missing `teaser`; blog cards lose the Ludic question hook', { field: 'teaser' });
  } else if (!String(frontmatter.teaser).trim().endsWith('?')) {
    addFinding('Nice', '`teaser` should usually be a playful question', { field: 'teaser' });
  }

  if (frontmatter.videoUrl) {
    for (const field of ['coverImage', 'videoTitle', 'videoDescription', 'videoUploadDate']) {
      if (!frontmatter[field]) {
        addFinding('Critical', `${field} is required when videoUrl is present`, { field });
      }
    }
    if (!isUrl(frontmatter.videoUrl)) {
      addFinding('Critical', '`videoUrl` must be a valid URL', { field: 'videoUrl' });
    }
    if (!frontmatter.videoDuration) {
      addFinding('Nice', '`videoDuration` is optional but useful for VideoObject schema', { field: 'videoDuration' });
    }
  }

  if (frontmatter.redditDiscussion && !isUrl(frontmatter.redditDiscussion)) {
    addFinding('Critical', '`redditDiscussion` must be a valid URL when present', { field: 'redditDiscussion' });
  }

  if (!articleExtensionPattern.test(filePath)) {
    addFinding('Critical', 'Article file must be .md or .mdx');
  }
}

function checkMarkdown({ addFinding, body, frontmatterEndLine, referencedPublicPaths, slug }) {
  const markdownImages = extractMarkdownImages(body);
  for (const image of markdownImages) {
    const line = frontmatterEndLine + image.line;
    if (!image.alt.trim()) {
      addFinding('Important', 'Image is missing alt text', { line, path: image.url });
    }
    checkMediaPath({ addFinding, line, referencedPublicPaths, slug, url: image.url });
  }

  const htmlImages = extractHtmlImages(body);
  for (const image of htmlImages) {
    const line = frontmatterEndLine + image.line;
    checkMediaPath({ addFinding, line, referencedPublicPaths, slug, url: image.url });
  }

  const headings = extractHeadings(body, frontmatterEndLine);
  for (const heading of headings) {
    if (heading.level === 1) {
      addFinding('Critical', 'Body contains `#` H1; the layout already generates the article H1', { line: heading.line });
    }
  }
  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1];
    const current = headings[index];
    if (current.level > previous.level + 1) {
      addFinding('Important', `Heading jumps from H${previous.level} to H${current.level}`, { line: current.line });
    }
  }

  const firstHeading = headings[0];
  if (firstHeading && firstHeading.level > 2) {
    addFinding('Important', 'Article body should usually start at `##`, not a deeper heading', { line: firstHeading.line });
  }

  if (/!\[\[/.test(body)) {
    addFinding('Critical', 'Obsidian wikilink image embed found; Astro expects Markdown image syntax');
  }

  if (/coverImage:\s*\/assets/.test(body)) {
    addFinding('Nice', 'Possible frontmatter fragment appears in article body');
  }
}

async function checkExternalReachability({ addFinding, body, frontmatter }) {
  if (!options.online) return;

  const urls = new Set();
  for (const url of extractMarkdownLinks(body)) {
    if (/^https?:\/\//.test(url)) urls.add(url);
  }
  for (const field of ['videoUrl', 'redditDiscussion']) {
    if (frontmatter[field]) urls.add(frontmatter[field]);
  }

  for (const url of urls) {
    const result = await checkUrl(url);
    if (!result.ok) {
      addFinding('Important', `External URL may be unreachable: ${url}`, { status: result.status, error: result.error });
    }
  }
}

function checkAssetFolder({ addFinding, assetFolder, referencedPublicPaths, slug }) {
  if (!fs.existsSync(assetFolder)) {
    if (referencedPublicPaths.size > 0) {
      addFinding('Important', `Canonical asset folder does not exist: /assets/img/blog/${slug}/`);
    }
    return;
  }

  const assetFiles = listFiles(assetFolder).map((filePath) => normalizePublicPath(`/assets/img/blog/${slug}/${path.relative(assetFolder, filePath)}`));
  for (const asset of assetFiles) {
    if (!referencedPublicPaths.has(asset)) {
      addFinding('Nice', `Unused asset in article folder: ${asset}`, { path: asset });
    }
  }
}

function checkMediaPath({ addFinding, line, referencedPublicPaths, slug, url }) {
  if (!url || url.startsWith('#')) return;
  if (/^https?:\/\//.test(url)) return;
  if (!url.startsWith('/assets/')) {
    addFinding('Important', 'Local media should use a site-root `/assets/...` path', { line, path: url });
    return;
  }

  checkPublicAssetPath({
    addFinding,
    line,
    pathValue: url,
    referencedPublicPaths,
    severity: 'Critical',
    slug,
    source: 'body',
  });
}

function checkPublicAssetPath({ addFinding, line, pathValue, referencedPublicPaths, severity, slug, source }) {
  const publicPath = normalizePublicPath(pathValue);
  referencedPublicPaths.add(publicPath);

  if (!publicPath.startsWith('/assets/')) {
    addFinding(severity, `${source} must use a site-root /assets/... path`, { line, path: pathValue });
    return;
  }

  const localPath = path.join(publicDir, publicPath.replace(/^\//, ''));
  if (!fs.existsSync(localPath)) {
    addFinding(severity, `Referenced local asset does not exist: ${publicPath}`, { line, path: publicPath });
  }

  const expectedPrefix = `/assets/img/blog/${slug}/`;
  if (publicPath.startsWith('/assets/img/blog/') && !publicPath.startsWith(expectedPrefix)) {
    addFinding('Important', `Article media should live under ${expectedPrefix}`, { line, path: publicPath });
  }
}

function normalizePublicPath(value) {
  const withoutTitle = String(value).trim().replace(/^<|>$/g, '').split(/\s+(?=(?:"[^"]*"|'[^']*')?$)/)[0];
  const withoutQuery = withoutTitle.split('#')[0].split('?')[0];
  try {
    return decodeURIComponent(withoutQuery);
  } catch {
    return withoutQuery;
  }
}

function extractMarkdownImages(body) {
  const results = [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  for (const match of body.matchAll(regex)) {
    results.push({
      alt: match[1],
      url: match[2].trim().replace(/^<|>$/g, ''),
      line: lineNumberAt(body, match.index),
    });
  }
  return results;
}

function extractMarkdownLinks(body) {
  const results = [];
  const regex = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of body.matchAll(regex)) {
    results.push(normalizePublicPath(match[1]));
  }
  return results;
}

function extractHtmlImages(body) {
  const results = [];
  const regex = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g;
  for (const match of body.matchAll(regex)) {
    results.push({
      url: match[1],
      line: lineNumberAt(body, match.index),
    });
  }
  return results;
}

function extractHeadings(body, frontmatterEndLine) {
  const headings = [];
  const lines = body.split('\n');
  lines.forEach((lineText, index) => {
    const match = lineText.match(/^(#{1,6})\s+\S/);
    if (!match) return;
    headings.push({
      level: match[1].length,
      line: frontmatterEndLine + index + 1,
    });
  });
  return headings;
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    return [entryPath];
  });
}

function isPlaceholder(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === 'your post title' || normalized === 'todo' || normalized === 'tbd';
}

function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }
    return { ok: response.ok, status: response.status };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function countFindings(findings) {
  return findings.reduce(
    (counts, finding) => {
      counts[finding.severity] += 1;
      return counts;
    },
    { Critical: 0, Important: 0, Nice: 0 },
  );
}

function printReports(reports) {
  for (const report of reports) {
    console.log(`\n${report.file}`);
    console.log(`  URL: ${report.url}`);
    console.log(`  Assets: ${report.assetFolder}`);
    console.log(
      `  Findings: ${report.counts.Critical} critical, ${report.counts.Important} important, ${report.counts.Nice} nice`,
    );

    if (report.findings.length === 0) {
      console.log('  OK: no local integrity issues found');
      continue;
    }

    for (const severity of ['Critical', 'Important', 'Nice']) {
      const findings = report.findings.filter((finding) => finding.severity === severity);
      if (findings.length === 0) continue;
      console.log(`\n  ${severity}`);
      for (const finding of findings) {
        const location = finding.line ? `:${finding.line}` : '';
        const pathInfo = finding.path ? ` (${finding.path})` : '';
        console.log(`  - ${report.file}${location} ${finding.message}${pathInfo}`);
      }
    }
  }
}
