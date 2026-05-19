const DATE_PREFIX = /^\d{2}-\d{2}-\d{2}_/;
const MONTH_PREFIX = /^\d{2}_/;
const POST_FILE = /\/post(?:\.(?:md|mdx))?$/;

type BlogEntry = {
  id?: string;
  slug: string;
};

const blogAssetUrls = import.meta.glob<string>('/src/content/blog/**/assets/*', {
  eager: true,
  import: 'default',
  query: '?url',
});

export function blogSlug(post: BlogEntry): string {
  const entryPath = entryPathFor(post);
  const parts = entryPath.split('/');
  const folderName = parts.at(-1) === 'post' ? parts.at(-2) : parts.at(-1);
  return (folderName ?? entryPath).replace(DATE_PREFIX, '').replace(MONTH_PREFIX, '');
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
  return entryPathFor(post).replace(POST_FILE, '');
}

function entryPathFor(post: BlogEntry): string {
  return (post.id ?? post.slug).replace(/\.(?:md|mdx)$/, '');
}
