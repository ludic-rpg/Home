import fs from 'node:fs';

const SITE_HOSTS = new Set(['ludicrpg.com', 'www.ludicrpg.com']);
const SITE_ICON_PATH = '/assets/ludic-rpg-logo-header.webp';
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

function iconPathFor(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
  if (SITE_HOSTS.has(parsed.hostname)) return SITE_ICON_PATH;

  const iconHost = parsed.hostname.replace(/^www\./, '');
  return faviconManifest[iconHost];
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(manifestUrl, 'utf8'));
  } catch {
    return {};
  }
}

function linkUrlFor(node) {
  if (node.type === 'link') return node.url;
  if (node.type === 'element' && node.tagName === 'a') return node.properties?.href;
  return undefined;
}

function hasImageChild(node) {
  return node.children?.some((child) => child.type === 'image' || (child.type === 'element' && child.tagName === 'img'));
}

function withLinkIconStyle(style, iconPath) {
  const declaration = `--link-icon: url("${iconPath}");`;
  if (!style) return declaration;
  if (style.includes('--link-icon:')) return style;

  return `${style.trim().replace(/;?$/, ';')} ${declaration}`;
}

function applyIconProperties(node, iconPath) {
  if (node.type === 'link') {
    node.data = node.data || {};
    node.data.hProperties = {
      ...(node.data.hProperties || {}),
      'data-link-icon': '',
      style: withLinkIconStyle(node.data.hProperties?.style, iconPath),
    };
    return;
  }

  node.properties = {
    ...(node.properties || {}),
    'data-link-icon': '',
    style: withLinkIconStyle(node.properties?.style, iconPath),
  };
}

export default function remarkLinkIcons() {
  return (tree) => {
    visit(tree, (node) => {
      const url = linkUrlFor(node);
      if (!url) return;
      if (hasImageChild(node)) return;

      const iconPath = iconPathFor(url);
      if (!iconPath) return;

      applyIconProperties(node, iconPath);
    });
  };
}
