import fs from 'node:fs';

const SITE_HOSTS = new Set(['ludicrpg.com', 'www.ludicrpg.com']);
const manifestUrl = new URL('../../data/link-favicons.json', import.meta.url);
const faviconManifest = readManifest();

function visit(node, visitor) {
  if (!node || typeof node !== 'object') return;
  visitor(node);

  if (!Array.isArray(node.children)) return;
  for (const child of node.children) {
    visit(child, visitor);
  }
}

function iconHostFor(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
  if (SITE_HOSTS.has(parsed.hostname)) return undefined;

  return parsed.hostname.replace(/^www\./, '');
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(manifestUrl, 'utf8'));
  } catch {
    return {};
  }
}

export default function remarkLinkIcons() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'link') return;
      if (node.children?.some((child) => child.type === 'image')) return;

      const iconHost = iconHostFor(node.url);
      if (!iconHost) return;

      const iconPath = faviconManifest[iconHost];
      if (!iconPath) return;

      node.data = node.data || {};
      node.data.hProperties = {
        ...(node.data.hProperties || {}),
        'data-link-icon': '',
        style: `--link-icon: url("${iconPath}");`,
      };
    });
  };
}
