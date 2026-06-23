#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourceDirs = [
  path.join(rootDir, 'src/content/blog'),
  path.join(rootDir, 'src/pages'),
];
const publicIconDir = path.join(rootDir, 'public/assets/link-icons');
const manifestPath = path.join(rootDir, 'src/data/link-favicons.json');
const siteHosts = new Set(['ludicrpg.com', 'www.ludicrpg.com']);
const markdownLinkPattern = /(?<!!)\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g;

const args = process.argv.slice(2);
const options = {
  check: args.includes('--check'),
  help: args.includes('--help') || args.includes('-h'),
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (options.help) {
    printUsage();
    return;
  }

  const hosts = await findExternalLinkHosts();
  const manifest = await readManifest();
  const missingHosts = hosts.filter((host) => !manifest[host]);

  if (options.check) {
    if (missingHosts.length > 0) {
      console.error(`Missing cached link icon(s): ${missingHosts.join(', ')}`);
      process.exit(1);
    }

    console.log(`Link favicon cache OK (${hosts.length} host(s)).`);
    return;
  }

  await fs.mkdir(publicIconDir, { recursive: true });

  const nextManifest = { ...manifest };
  const refreshed = [];
  for (const host of missingHosts) {
    const iconPath = await fetchAndCacheIcon(host);
    if (!iconPath) continue;

    nextManifest[host] = iconPath;
    refreshed.push(host);
  }

  const sortedManifest = Object.fromEntries(
    Object.entries(nextManifest)
      .filter(([host]) => hosts.includes(host))
      .sort(([a], [b]) => a.localeCompare(b)),
  );

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(sortedManifest, null, 2)}\n`);
  const removed = await removeStaleIcons(sortedManifest);

  if (refreshed.length > 0) {
    console.log(`Cached ${refreshed.length} link icon(s): ${refreshed.join(', ')}`);
  } else {
    console.log(`Link favicon cache already up to date (${hosts.length} host(s)).`);
  }

  if (removed.length > 0) {
    console.log(`Removed ${removed.length} stale link icon(s): ${removed.join(', ')}`);
  }
}

function printUsage() {
  console.log(`Usage:
  npm run links:favicons
  npm run links:favicons:check

links:favicons scans Markdown links, downloads missing favicons, and writes src/data/link-favicons.json.
links:favicons:check verifies that every external Markdown link host has a cached icon.`);
}

async function findExternalLinkHosts() {
  const hosts = new Set();

  for (const sourceDir of sourceDirs) {
    if (!(await exists(sourceDir))) continue;

    const files = await findFiles(sourceDir, isContentMarkdownFile);
    for (const filePath of files) {
      const source = stripCodeBlocks(await fs.readFile(filePath, 'utf8'));
      for (const match of source.matchAll(markdownLinkPattern)) {
        const host = hostForUrl(match[1]);
        if (host) hosts.add(host);
      }
    }
  }

  return [...hosts].sort();
}

function stripCodeBlocks(source) {
  return source.replace(/```[\s\S]*?```/g, '');
}

function isContentMarkdownFile(filePath) {
  return path.extname(filePath) === '.md' && !path.basename(filePath).startsWith('_');
}

function hostForUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
    if (siteHosts.has(parsed.hostname)) return undefined;
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

async function fetchAndCacheIcon(host) {
  const endpoint = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(`https://${host}`)}`;
  const response = await fetch(endpoint, {
    headers: {
      'user-agent': 'LudicRPG link favicon cache/1.0',
    },
  });

  if (!response.ok) {
    console.warn(`Could not fetch favicon for ${host}: HTTP ${response.status}`);
    return undefined;
  }

  const input = Buffer.from(await response.arrayBuffer());
  const fileName = `${slugForHost(host)}.webp`;
  const outputPath = path.join(publicIconDir, fileName);
  await sharp(input).resize(64, 64, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 92 }).toFile(outputPath);

  return `/assets/link-icons/${fileName}`;
}

async function removeStaleIcons(manifest) {
  if (!(await exists(publicIconDir))) return [];

  const expectedFiles = new Set(Object.values(manifest).map((assetPath) => path.basename(assetPath)));
  const entries = await fs.readdir(publicIconDir, { withFileTypes: true });
  const removed = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.webp')) continue;
    if (expectedFiles.has(entry.name)) continue;

    await fs.rm(path.join(publicIconDir, entry.name));
    removed.push(entry.name);
  }

  return removed;
}

function slugForHost(host) {
  return host
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch {
    return {};
  }
}

async function findFiles(dir, predicate = () => true) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findFiles(filePath, predicate)));
    } else if (predicate(filePath)) {
      files.push(filePath);
    }
  }

  return files.sort();
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
