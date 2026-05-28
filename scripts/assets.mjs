#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const blogDir = path.join(rootDir, 'src/content/blog');
const publicImageDir = path.join(rootDir, 'public/assets/img');
const sourceDirs = [path.join(rootDir, 'src'), path.join(rootDir, 'scripts')];
const textExtensions = new Set(['.astro', '.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.tsx']);
const rasterExtensionPattern = /\.(?:png|jpe?g)$/i;
const coverRasterPattern = /^cover\.(?:png|jpe?g)$/i;
const postFilePattern = /^post\.md$/i;
const articleExtensionPattern = /\.md$/i;
const monthDayFolderPattern = /^\d{2}-\d{2}$/;
const webpOptions = { quality: 92, effort: 6 };

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

  const report = {
    findings: [],
    converted: [],
    removed: [],
    updated: [],
  };

  await processBlogCovers(report);
  await processPublicImages(report);

  printReport(report);

  if (report.findings.length > 0) {
    process.exit(1);
  }
}

function printUsage() {
  console.log(`Usage:
  npm run assets:check
  npm run assets:optimize

assets:check verifies that blog covers and public/assets/img files are WebP.
assets:optimize converts raster files to WebP, updates safe references, and removes replaced rasters.`);
}

async function processBlogCovers(report) {
  if (!(await exists(blogDir))) return;

  const assetFiles = await findFiles(blogDir);
  const rasterCovers = assetFiles.filter((filePath) => coverRasterPattern.test(path.basename(filePath)));

  for (const coverPath of rasterCovers) {
    const webpPath = path.join(path.dirname(coverPath), 'cover.webp');

    if (options.check) {
      addFinding(report, `Blog cover must be WebP: ${relative(coverPath)}`);
      continue;
    }

    await writeWebpIfNeeded(coverPath, webpPath, report);
    await fs.rm(coverPath);
    report.removed.push(relative(coverPath));
  }

  const postFiles = assetFiles.filter(isBlogArticleFile);
  for (const postPath of postFiles) {
    const source = await fs.readFile(postPath, 'utf8');
    const coverMatch = source.match(/^coverImage:\s*(['"]?)(\.\/assets\/cover\.(?:webp|png|jpe?g))\1\s*$/im);

    if (!coverMatch) continue;

    const coverRef = coverMatch[2];
    if (rasterExtensionPattern.test(coverRef)) {
      if (options.check) {
        addFinding(report, `Blog frontmatter must reference cover.webp: ${relative(postPath)}`);
      } else {
        const nextSource = source.replace(
          /^(coverImage:\s*['"]?\.\/assets\/cover\.)(?:png|jpe?g)(['"]?\s*)$/im,
          '$1webp$2',
        );
        if (nextSource !== source) {
          await fs.writeFile(postPath, nextSource);
          report.updated.push(relative(postPath));
        }
      }
      continue;
    }

    const coverPath = path.join(path.dirname(postPath), coverRef);
    if (!(await exists(coverPath))) {
      addFinding(report, `Missing blog cover file referenced by ${relative(postPath)}: ${coverRef}`);
    }
  }
}

function isBlogArticleFile(filePath) {
  const fileName = path.basename(filePath);
  if (!articleExtensionPattern.test(fileName) || fileName.startsWith('_')) return false;
  if (postFilePattern.test(fileName)) return true;

  return monthDayFolderPattern.test(path.basename(path.dirname(filePath)));
}

async function processPublicImages(report) {
  if (!(await exists(publicImageDir))) return;

  const imageFiles = await findFiles(publicImageDir);
  const rasterImages = imageFiles.filter((filePath) => rasterExtensionPattern.test(filePath));
  const replacements = new Map();

  for (const imagePath of rasterImages) {
    const webpPath = imagePath.replace(rasterExtensionPattern, '.webp');
    replacements.set(publicAssetUrl(imagePath), publicAssetUrl(webpPath));

    if (options.check) {
      addFinding(report, `Public asset image must be WebP: ${relative(imagePath)}`);
      continue;
    }

    await writeWebpIfNeeded(imagePath, webpPath, report);
    await fs.rm(imagePath);
    report.removed.push(relative(imagePath));
  }

  await processPublicImageReferences(report, replacements);
}

async function processPublicImageReferences(report, replacements) {
  const textFiles = [];
  for (const sourceDir of sourceDirs) {
    if (await exists(sourceDir)) {
      textFiles.push(...(await findFiles(sourceDir, (filePath) => textExtensions.has(path.extname(filePath)))));
    }
  }

  const publicImageRefPattern = /\/assets\/img\/[^\s"'<>)]*\.(?:png|jpe?g)\b/gi;

  for (const filePath of textFiles) {
    const source = await fs.readFile(filePath, 'utf8');
    const urls = [...new Set([...source.matchAll(publicImageRefPattern)].map((match) => match[0]))];
    if (urls.length === 0) continue;

    if (options.check) {
      for (const url of urls) {
        addFinding(report, `Public asset reference must use WebP in ${relative(filePath)}: ${url}`);
      }
      continue;
    }

    let nextSource = source;
    for (const url of urls) {
      const replacement = replacements.get(url) ?? (await existingWebpUrlForPublicRasterUrl(url));
      if (!replacement) {
        addFinding(report, `Cannot update missing public asset replacement in ${relative(filePath)}: ${url}`);
        continue;
      }

      nextSource = nextSource.split(url).join(replacement);
    }

    if (nextSource !== source) {
      await fs.writeFile(filePath, nextSource);
      report.updated.push(relative(filePath));
    }
  }
}

async function writeWebpIfNeeded(inputPath, outputPath, report) {
  const shouldWrite = !(await exists(outputPath)) || (await isOlderThan(outputPath, inputPath));
  if (!shouldWrite) return;

  await sharp(inputPath).webp(webpOptions).toFile(outputPath);
  report.converted.push(relative(outputPath));
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

async function isOlderThan(targetPath, sourcePath) {
  const [targetStat, sourceStat] = await Promise.all([fs.stat(targetPath), fs.stat(sourcePath)]);
  return targetStat.mtimeMs < sourceStat.mtimeMs;
}

function publicAssetUrl(filePath) {
  return `/${path.relative(path.join(rootDir, 'public'), filePath).split(path.sep).join('/')}`;
}

async function existingWebpUrlForPublicRasterUrl(url) {
  const webpUrl = url.replace(rasterExtensionPattern, '.webp');
  const webpPath = path.join(rootDir, 'public', webpUrl.slice(1));
  return (await exists(webpPath)) ? webpUrl : null;
}

function addFinding(report, message) {
  report.findings.push(message);
}

function relative(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function printReport(report) {
  if (report.converted.length) {
    console.log(`Converted ${report.converted.length} image(s):`);
    for (const filePath of report.converted) console.log(`  ${filePath}`);
  }

  if (report.updated.length) {
    console.log(`Updated ${report.updated.length} file(s):`);
    for (const filePath of report.updated) console.log(`  ${filePath}`);
  }

  if (report.removed.length) {
    console.log(`Removed ${report.removed.length} replaced raster image(s):`);
    for (const filePath of report.removed) console.log(`  ${filePath}`);
  }

  if (report.findings.length) {
    console.error(`Asset check failed with ${report.findings.length} issue(s):`);
    for (const finding of report.findings) console.error(`  - ${finding}`);
    return;
  }

  console.log(options.check ? 'Asset check passed.' : 'Assets optimized.');
}
