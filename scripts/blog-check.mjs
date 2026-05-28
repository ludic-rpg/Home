#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const blogDir = path.join(rootDir, 'src/content/blog');
const datePrefixPattern = /^\d{2}-\d{2}-\d{2}_/;
const monthDayPrefixPattern = /^\d{2}-\d{2}_/;
const articleExtensionPattern = /\.md$/;
const postFilePattern = /^post\.md$/;
const yearFolderPattern = /^\d{4}$/;
const monthDayFolderPattern = /^(?<month>\d{2})-(?<day>\d{2})$/;
const monthDaySlugFolderPattern = /^(?<month>\d{2})-(?<day>\d{2})_(?<slug>.+)$/;
const youtubeIdPattern =
  /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  includeDrafts: args.includes('--include-drafts'),
  json: args.includes('--json'),
  online: args.includes('--online'),
  strictAssets: args.includes('--strict-assets'),
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
  --strict-assets
             Treat unused files in an article assets folder as critical
  --include-drafts
             Include draft posts in --all
  --json     Print machine-readable JSON`);
}

function getAllArticleFiles() {
  return findArticleFiles(blogDir)
    .filter((filePath) => options.includeDrafts || !isDraftArticle(filePath))
    .sort();
}

function findArticleFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) return findArticleFiles(entryPath);
    if (entry.isFile() && isArticleFile(entryPath)) return [entryPath];
    return [];
  });
}

function isArticleFile(filePath) {
  const fileName = path.basename(filePath);
  if (!articleExtensionPattern.test(fileName) || fileName.startsWith('_')) return false;
  if (postFilePattern.test(fileName)) return true;

  const parentFolder = path.basename(path.dirname(filePath));
  return monthDayFolderPattern.test(parentFolder);
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
  if (fs.existsSync(blogRelativePath) && fs.statSync(blogRelativePath).isDirectory()) {
    const articleFile = findArticleFileInDir(blogRelativePath);
    if (articleFile) return articleFile;
  }

  const targetSlug = getPublicSlug(normalizedTarget.replace(articleExtensionPattern, ''));
  const match = getAllArticleFiles().find((filePath) => getArticleInfo(filePath).slug === targetSlug);
  if (match) return match;

  throw new Error(`Could not find blog article for "${target}".`);
}

function findArticleFileInDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dir, entry.name))
    .filter(isArticleFile)
    .sort();

  return files[0] ?? null;
}

async function checkArticle(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const article = getArticleInfo(filePath);
  const { frontmatter, body, frontmatterEndLine } = parseFrontmatter(source);
  const findings = [];
  const referencedAssetFiles = new Set();

  const addFinding = (severity, message, detail = {}) => {
    findings.push({ severity, message, ...detail });
  };

  checkArticleStructure({ addFinding, article, frontmatter });
  checkFrontmatter({ addFinding, article, filePath, frontmatter, referencedAssetFiles });
  checkMarkdown({ addFinding, article, body, frontmatterEndLine, referencedAssetFiles });
  await checkExternalReachability({ addFinding, body, frontmatter });
  checkAssetFolder({ addFinding, article, referencedAssetFiles });

  return {
    file: path.relative(rootDir, filePath),
    slug: article.slug,
    url: `/blog/${article.slug}/`,
    assetFolder: path.relative(rootDir, article.assetFolder),
    counts: countFindings(findings),
    findings,
  };
}

function getPublicSlug(fileName) {
  return fileName
    .replace(datePrefixPattern, '')
    .replace(monthDayPrefixPattern, '')
    .replace(/^\d{2}_/, '');
}

function getArticleInfo(filePath) {
  const articleDir = path.dirname(filePath);
  const relativeDir = path.relative(blogDir, articleDir);
  const parts = relativeDir.split(path.sep);
  const yearFolder = parts[0] ?? '';
  const articleFolder = parts.at(-1) ?? path.basename(filePath, path.extname(filePath));
  const monthDayMatch = articleFolder.match(monthDaySlugFolderPattern);
  const dateFolderMatch = articleFolder.match(monthDayFolderPattern);
  const fileSlug = path.basename(filePath, path.extname(filePath));
  const slug = getPublicSlug(dateFolderMatch ? fileSlug : (monthDayMatch?.groups?.slug ?? articleFolder));

  return {
    filePath,
    articleDir,
    assetFolder: path.join(articleDir, 'assets'),
    relativeDir,
    yearFolder,
    articleFolder,
    month: dateFolderMatch?.groups?.month ?? monthDayMatch?.groups?.month ?? '',
    day: dateFolderMatch?.groups?.day ?? monthDayMatch?.groups?.day ?? '',
    slug,
    isNewLayout: Boolean(dateFolderMatch),
    isLegacyLayout: Boolean(monthDayMatch) && postFilePattern.test(path.basename(filePath)),
  };
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

function checkArticleStructure({ addFinding, article, frontmatter }) {
  const relativeFile = path.relative(blogDir, article.filePath);
  if (!yearFolderPattern.test(article.yearFolder) || (!article.isNewLayout && !article.isLegacyLayout)) {
    addFinding('Critical', 'Article must live at src/content/blog/YYYY/MM-DD/article-slug.md', {
      path: relativeFile,
    });
  }

  if (frontmatter.publishDate) {
    const publishDate = new Date(frontmatter.publishDate);
    if (!Number.isNaN(publishDate.valueOf())) {
      const expectedYear = String(publishDate.getFullYear());
      const expectedMonth = String(publishDate.getMonth() + 1).padStart(2, '0');
      const expectedDay = String(publishDate.getDate()).padStart(2, '0');
      if (article.yearFolder !== expectedYear || article.month !== expectedMonth || article.day !== expectedDay) {
        addFinding('Important', 'Article folder year/month/day should match publishDate', {
          path: relativeFile,
        });
      }
    }
  }
}

function checkFrontmatter({ addFinding, article, filePath, frontmatter, referencedAssetFiles }) {
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
    checkLocalAssetPath({
      addFinding,
      article,
      pathValue: frontmatter.coverImage,
      referencedAssetFiles,
      severity: 'Critical',
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

  if (!articleExtensionPattern.test(filePath)) {
    addFinding('Critical', 'Article file must be .md');
  }
}

function checkMarkdown({ addFinding, article, body, frontmatterEndLine, referencedAssetFiles }) {
  const markdownImages = extractMarkdownImages(body);
  for (const image of markdownImages) {
    const line = frontmatterEndLine + image.line;
    if (!image.alt.trim()) {
      addFinding('Important', 'Image is missing alt text', { line, path: image.url });
    }
    checkInlineYouTubeAsset({ addFinding, article, line, referencedAssetFiles, url: image.url });
    checkMediaPath({ addFinding, article, line, referencedAssetFiles, url: image.url });
  }

  const htmlImages = extractHtmlImages(body);
  for (const image of htmlImages) {
    const line = frontmatterEndLine + image.line;
    checkMediaPath({ addFinding, article, line, referencedAssetFiles, url: image.url });
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

  if (/coverImage:\s*(?:\/assets|\.\/assets)/.test(body)) {
    addFinding('Nice', 'Possible frontmatter fragment appears in article body');
  }
}

async function checkExternalReachability({ addFinding, body, frontmatter }) {
  if (!options.online) return;

  const urls = new Set();
  for (const url of extractMarkdownLinks(body)) {
    if (/^https?:\/\//.test(url)) urls.add(url);
  }
  for (const field of ['videoUrl']) {
    if (frontmatter[field]) urls.add(frontmatter[field]);
  }

  for (const url of urls) {
    const result = await checkUrl(url);
    if (!result.ok) {
      addFinding('Important', `External URL may be unreachable: ${url}`, { status: result.status, error: result.error });
    }
  }
}

function checkAssetFolder({ addFinding, article, referencedAssetFiles }) {
  if (!fs.existsSync(article.assetFolder)) {
    if (referencedAssetFiles.size > 0) {
      addFinding('Critical', 'Article references local assets, but the assets folder does not exist', {
        path: path.relative(rootDir, article.assetFolder),
      });
    }
    return;
  }

  const assetFiles = listFiles(article.assetFolder);
  for (const asset of assetFiles) {
    if (!referencedAssetFiles.has(asset)) {
      addFinding(options.strictAssets ? 'Critical' : 'Nice', `Unused asset in article folder: ${assetPathForReport(article, asset)}`, {
        path: assetPathForReport(article, asset),
      });
    }
  }
}

function checkMediaPath({ addFinding, article, line, referencedAssetFiles, url }) {
  if (!url || url.startsWith('#')) return;
  if (/^https?:\/\//.test(url)) return;
  checkLocalAssetPath({
    addFinding,
    article,
    line,
    pathValue: url,
    referencedAssetFiles,
    severity: 'Critical',
    source: 'body',
  });
}

function checkInlineYouTubeAsset({ addFinding, article, line, referencedAssetFiles, url }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) return;

  const assetPath = path.join(article.assetFolder, `youtube-${videoId}.webp`);
  referencedAssetFiles.add(assetPath);

  if (!fs.existsSync(assetPath)) {
    addFinding('Important', `Inline YouTube embed is missing local facade poster: ./assets/youtube-${videoId}.webp`, {
      line,
      path: url,
    });
  }
}

function extractYouTubeId(url) {
  const match = String(url || '').match(youtubeIdPattern);
  return match ? match[1] : null;
}

function checkLocalAssetPath({ addFinding, article, line, pathValue, referencedAssetFiles, severity, source }) {
  const mediaPath = normalizeMediaPath(pathValue);

  if (/^https?:\/\//.test(mediaPath)) return;

  if (mediaPath.startsWith('/assets/img/blog/')) {
    addFinding(severity, `${source} must use colocated ./assets/... paths, not the old /assets/img/blog/... tree`, {
      line,
      path: mediaPath,
    });
    return;
  }

  if (mediaPath.startsWith('/assets/')) {
    addFinding('Important', `${source} uses a shared /assets/... path; article-owned media should live in ./assets/`, {
      line,
      path: mediaPath,
    });
    return;
  }

  if (!mediaPath.startsWith('./assets/')) {
    addFinding(severity, `${source} must use ./assets/... for article-owned local media`, {
      line,
      path: mediaPath,
    });
    return;
  }

  const localPath = path.resolve(article.articleDir, mediaPath);
  referencedAssetFiles.add(localPath);
  if (!fs.existsSync(localPath)) {
    addFinding(severity, `Referenced local asset does not exist: ${mediaPath}`, { line, path: mediaPath });
  }
}

function normalizeMediaPath(value) {
  const withoutTitle = String(value).trim().replace(/^<|>$/g, '').split(/\s+(?=(?:"[^"]*"|'[^']*')?$)/)[0];
  const withoutQuery = withoutTitle.split('#')[0].split('?')[0];
  try {
    return decodeURIComponent(withoutQuery);
  } catch {
    return withoutQuery;
  }
}

function assetPathForReport(article, filePath) {
  return `./assets/${path.relative(article.assetFolder, filePath).split(path.sep).join('/')}`;
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
    results.push(normalizeMediaPath(match[1]));
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
