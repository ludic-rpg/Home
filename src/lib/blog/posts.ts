import type { ImageMetadata } from 'astro';

const DATE_PREFIX = /^\d{2}-\d{2}-\d{2}_/;
const MONTH_DAY_PREFIX = /^\d{2}-\d{2}_/;
const MONTH_PREFIX = /^\d{2}_/;
const POST_FILE = /\/post(?:\.md)?$/;

type BlogEntry = {
  id?: string;
  slug: string;
};

const blogAssetUrls = import.meta.glob<string>('/src/content/blog/**/assets/*', {
  eager: true,
  import: 'default',
  query: '?url&no-inline',
});

const blogImageMetadata = import.meta.glob<ImageMetadata>(
  '/src/content/blog/**/assets/*.{avif,gif,jpeg,jpg,png,webp}',
  { import: 'default' },
);

export async function resolveBlogImageMetadata(post: BlogEntry, assetPath?: string): Promise<ImageMetadata | undefined> {
  if (!assetPath?.startsWith('./assets/')) return undefined;
  const globKey = `/src/content/blog/${articleDirFor(post)}/${assetPath.replace('./', '')}`;
  const loadMetadata = blogImageMetadata[globKey];
  return loadMetadata ? await loadMetadata() : undefined;
}

export function blogSlug(post: BlogEntry): string {
  const entryPath = entryPathFor(post);
  const parts = entryPath.split('/');
  const articleName = parts.at(-1) === 'post' ? parts.at(-2) : parts.at(-1);
  return (articleName ?? entryPath)
    .replace(DATE_PREFIX, '')
    .replace(MONTH_DAY_PREFIX, '')
    .replace(MONTH_PREFIX, '');
}

export function blogUrl(post: BlogEntry): string {
  return `/blog/${blogSlug(post)}/`;
}

export function resolveBlogAsset(post: BlogEntry, assetPath?: string): string | undefined {
  if (!assetPath || !assetPath.startsWith('./assets/')) return assetPath;

  const articleDir = articleDirFor(post);
  const globKey = `/src/content/blog/${articleDir}/${assetPath.replace('./', '')}`;
  return blogAssetUrls[globKey] ?? assetPath;
}

function articleDirFor(post: BlogEntry): string {
  const entryPath = entryPathFor(post);
  if (POST_FILE.test(entryPath)) return entryPath.replace(POST_FILE, '');

  const parts = entryPath.split('/');
  parts.pop();
  return parts.join('/');
}

function entryPathFor(post: BlogEntry): string {
  return (post.id ?? post.slug).replace(/\.md$/, '');
}
