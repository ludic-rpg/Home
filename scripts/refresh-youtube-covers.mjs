#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const BLOG_ROOT = path.resolve('src/content/blog');
const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const THUMBNAIL_CANDIDATES = [
  'maxresdefault.jpg',
  'sddefault.jpg',
  'hqdefault.jpg',
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const onlyFilter = onlyArg ? onlyArg.slice('--only='.length) : null;
const ARTICLE_EXTENSION_PATTERN = /\.md$/;
const MONTH_DAY_FOLDER_PATTERN = /^\d{2}-\d{2}$/;

async function findPostFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findPostFiles(fullPath));
      continue;
    }

    if (entry.isFile() && isArticleFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isArticleFile(filePath) {
  const fileName = path.basename(filePath);
  if (!ARTICLE_EXTENSION_PATTERN.test(fileName) || fileName.startsWith('_')) return false;
  if (fileName === 'post.md') return true;

  return MONTH_DAY_FOLDER_PATTERN.test(path.basename(path.dirname(filePath)));
}

function publicSlugFor(postPath) {
  const fileName = path.basename(postPath, path.extname(postPath));
  if (fileName !== 'post') return fileName;

  return path.basename(path.dirname(postPath)).replace(/^\d{2}-\d{2}_/, '');
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const data = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!field) continue;
    const [, key, rawValue] = field;
    data[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
  }

  return data;
}

function extractYouTubeId(url) {
  const match = url?.match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

function extractInlineYouTubeEmbeds(source) {
  const embeds = new Map();

  for (const match of source.matchAll(/<YouTube\b[^>]*\bid=["']([^"']+)["'][^>]*>/g)) {
    const videoId = extractYouTubeId(match[1]) || match[1];
    if (videoId) embeds.set(videoId, match[0]);
  }

  for (const match of source.matchAll(/!\[[^\]]*\]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^)]+)\)/g)) {
    const videoId = extractYouTubeId(match[1]);
    if (videoId) embeds.set(videoId, match[0]);
  }

  return [...embeds.keys()];
}

async function fetchThumbnail(videoId) {
  const errors = [];

  for (const filename of THUMBNAIL_CANDIDATES) {
    const url = `https://i.ytimg.com/vi/${videoId}/${filename}`;
    const response = await fetch(url);
    if (!response.ok) {
      errors.push(`${filename}: HTTP ${response.status}`);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height || metadata.width < 300 || metadata.height < 160) {
      errors.push(`${filename}: unusable ${metadata.width || '?'}x${metadata.height || '?'}`);
      continue;
    }

    return { buffer, source: url, width: metadata.width, height: metadata.height };
  }

  throw new Error(`No usable thumbnail found for ${videoId}: ${errors.join(', ')}`);
}

async function detectSideCrop(buffer) {
  const { data, info } = await sharp(buffer)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const stride = Math.max(1, Math.floor(height / 180));

  function isDarkColumn(x) {
    let darkPixels = 0;
    let sampledPixels = 0;
    let lumaTotal = 0;

    for (let y = 0; y < height; y += stride) {
      const offset = (y * width + x) * channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sampledPixels += 1;
      lumaTotal += luma;
      if (luma <= 28) darkPixels += 1;
    }

    return darkPixels / sampledPixels >= 0.92 && lumaTotal / sampledPixels <= 20;
  }

  let left = 0;
  while (left < width * 0.45 && isDarkColumn(left)) left += 1;

  let right = width - 1;
  while (right > width * 0.55 && isDarkColumn(right)) right -= 1;

  const cropWidth = right - left + 1;

  if (cropWidth < width * 0.25 || cropWidth > width * 0.99) {
    return { left: 0, width, height, cropped: false };
  }

  return { left, width: cropWidth, height, cropped: true };
}

async function writeCroppedThumbnail(videoId, outputPath) {
  const thumbnail = await fetchThumbnail(videoId);
  const crop = await detectSideCrop(thumbnail.buffer);
  const output = sharp(thumbnail.buffer).rotate();

  if (crop.cropped) {
    output.extract({ left: crop.left, top: 0, width: crop.width, height: crop.height });
  }

  const outputBuffer = await output.webp({ quality: 90 }).toBuffer();
  const outputMetadata = await sharp(outputBuffer).metadata();

  if (!dryRun) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, outputBuffer);
  }

  return {
    source: thumbnail.source,
    input: `${thumbnail.width}x${thumbnail.height}`,
    output: `${outputMetadata.width}x${outputMetadata.height}`,
    cropped: crop.cropped ? `${crop.left}px left, ${thumbnail.width - crop.left - crop.width}px right` : 'no',
  };
}

async function refreshCover(postPath) {
  const source = await fs.readFile(postPath, 'utf8');
  const frontmatter = parseFrontmatter(source);
  if (!frontmatter?.videoUrl) return null;

  const slug = publicSlugFor(postPath);
  if (onlyFilter && !postPath.includes(onlyFilter) && slug !== onlyFilter) return null;

  const videoId = extractYouTubeId(frontmatter.videoUrl);
  if (!videoId) throw new Error(`Could not extract YouTube ID from ${frontmatter.videoUrl}`);

  const coverImage = frontmatter.coverImage || './assets/cover.webp';
  const coverPath = path.resolve(path.dirname(postPath), coverImage);

  if (!force) {
    await fs.access(coverPath);
  }

  const thumbnail = await writeCroppedThumbnail(videoId, coverPath);

  return {
    post: path.relative(process.cwd(), postPath),
    cover: path.relative(process.cwd(), coverPath),
    videoId,
    ...thumbnail,
  };
}

async function refreshInlineThumbnails(postPath) {
  const source = await fs.readFile(postPath, 'utf8');
  const slug = publicSlugFor(postPath);
  if (onlyFilter && !postPath.includes(onlyFilter) && slug !== onlyFilter) return [];

  const videoIds = extractInlineYouTubeEmbeds(source);
  const results = [];

  for (const videoId of videoIds) {
    const assetPath = path.join(path.dirname(postPath), 'assets', `youtube-${videoId}.webp`);

    if (!force) {
      try {
        await fs.access(assetPath);
        results.push({
          post: path.relative(process.cwd(), postPath),
          cover: path.relative(process.cwd(), assetPath),
          videoId,
          skipped: true,
        });
        continue;
      } catch {
        // Missing inline thumbnails should be created.
      }
    }

    const thumbnail = await writeCroppedThumbnail(videoId, assetPath);
    results.push({
      post: path.relative(process.cwd(), postPath),
      cover: path.relative(process.cwd(), assetPath),
      videoId,
      ...thumbnail,
    });
  }

  return results;
}

const postFiles = await findPostFiles(BLOG_ROOT);
const results = [];

for (const postPath of postFiles) {
  const result = await refreshCover(postPath);
  if (result) results.push(result);

  const inlineResults = await refreshInlineThumbnails(postPath);
  results.push(...inlineResults);
}

if (!results.length) {
  console.log('No matching video posts found.');
  process.exit(0);
}

for (const result of results) {
  if (result.skipped) {
    console.log(`kept ${result.cover}`);
    console.log(`  post: ${result.post}`);
    console.log(`  video: ${result.videoId}`);
    continue;
  }

  const action = dryRun ? 'would update' : 'updated';
  console.log(`${action} ${result.cover}`);
  console.log(`  post: ${result.post}`);
  console.log(`  video: ${result.videoId}`);
  console.log(`  source: ${result.source}`);
  console.log(`  size: ${result.input} -> ${result.output}`);
  console.log(`  cropped: ${result.cropped}`);
}
