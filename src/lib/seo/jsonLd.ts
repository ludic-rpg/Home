import { BRAND, ENTITY_IDS, SITE_URL } from './constants';
import {
  extractYouTubeId,
  toYouTubeEmbedUrl,
  toYouTubeThumbnailUrl,
  toYouTubeWatchUrl,
} from './youtube';

export type JsonLdObject = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type ArticleJsonLdInput = {
  headline: string;
  description: string;
  canonical: string;
  image: string;
  publishedTime: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  video?: VideoJsonLdInput;
};

export type VideoJsonLdInput = {
  url: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  uploadDate: string;
  duration?: string;
};

export type WebPageJsonLdInput = {
  title: string;
  description: string;
  canonical: string;
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage';
  image?: string;
  mainEntityId?: string;
  significantLinks?: string[];
  mentions?: JsonLdObject[];
};

export type ItemListEntry = {
  name: string;
  url: string;
  description?: string;
  image?: string;
  datePublished?: string;
  itemType?: 'BlogPosting' | 'CollectionPage' | 'WebPage';
};

function toAbsoluteUrl(url: string): string {
  return url.startsWith('http')
    ? url
    : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function organizationEntity(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ENTITY_IDS.organization,
    name: BRAND.name,
    url: `${SITE_URL}/`,
    logo: BRAND.logo,
    description: BRAND.description,
    founder: { '@id': ENTITY_IDS.person },
    knowsAbout: BRAND.knowsAbout,
    sameAs: BRAND.sameAs,
  };
}

export function personEntity(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': ENTITY_IDS.person,
    name: 'Ludovic Fleury',
    alternateName: 'Ludo',
    url: `${SITE_URL}/about/`,
    image: BRAND.personImage,
    jobTitle: 'Creator of Ludic RPG',
    description:
      'Creator of Ludic RPG, crafting immersive tabletop RPG and TTRPG experiences, GM tools, props, maps, and campaign material.',
    affiliation: { '@id': ENTITY_IDS.organization },
    knowsAbout: BRAND.knowsAbout,
    sameAs: BRAND.sameAs,
  };
}

export function websiteEntity(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': ENTITY_IDS.website,
    name: BRAND.name,
    url: `${SITE_URL}/`,
    publisher: { '@id': ENTITY_IDS.organization },
    creator: { '@id': ENTITY_IDS.person },
    inLanguage: 'en',
  };
}

export function webPageEntity(input: WebPageJsonLdInput): JsonLdObject {
  const page: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': input.type || 'WebPage',
    '@id': `${input.canonical}#webpage`,
    url: input.canonical,
    name: input.title,
    description: input.description,
    isPartOf: { '@id': ENTITY_IDS.website },
    publisher: { '@id': ENTITY_IDS.organization },
  };

  if (input.image) {
    page.primaryImageOfPage = input.image;
  }

  if (input.mainEntityId) {
    page.mainEntity = { '@id': input.mainEntityId };
  }

  if (input.significantLinks?.length) {
    page.significantLink = input.significantLinks;
  }

  if (input.mentions?.length) {
    page.mentions = input.mentions;
  }

  return page;
}

export function blogPostingEntity(input: ArticleJsonLdInput): JsonLdObject {
  const articleId = `${input.canonical}#article`;
  const article: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': articleId,
    headline: input.headline,
    description: input.description,
    url: input.canonical,
    image: input.image,
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime || input.publishedTime,
    author: { '@id': ENTITY_IDS.person },
    publisher: { '@id': ENTITY_IDS.organization },
    mainEntityOfPage: { '@id': `${input.canonical}#webpage` },
    keywords: (input.tags || []).join(', '),
    articleSection: input.section || 'Blog',
  };

  if (input.video) {
    article.video = { '@id': `${input.canonical}#video` };
  }

  return article;
}

export function breadcrumbEntity(canonical: string, items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function videoObjectEntity(canonical: string, video: VideoJsonLdInput): JsonLdObject | null {
  const videoId = extractYouTubeId(video.url);
  if (!videoId) return null;

  const videoObject: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${canonical}#video`,
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl || toYouTubeThumbnailUrl(videoId),
    uploadDate: video.uploadDate,
    embedUrl: toYouTubeEmbedUrl(videoId),
    url: toYouTubeWatchUrl(videoId),
    sameAs: toYouTubeWatchUrl(videoId),
    publisher: { '@id': ENTITY_IDS.organization },
  };

  if (video.duration) {
    videoObject.duration = video.duration;
  }

  return videoObject;
}

export function itemListEntity(canonical: string, items: ItemListEntry[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${canonical}#itemlist`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': item.itemType || 'BlogPosting',
        '@id': `${item.url}${!item.itemType || item.itemType === 'BlogPosting' ? '#article' : '#webpage'}`,
        url: item.url,
        ...(item.itemType === 'CollectionPage' ? {} : { headline: item.name }),
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(item.image ? { image: toAbsoluteUrl(item.image) } : {}),
        ...(item.datePublished ? { datePublished: item.datePublished } : {}),
      },
    })),
  };
}

export function compactJsonLd(items: Array<JsonLdObject | null | undefined>): JsonLdObject[] {
  return items.filter((item): item is JsonLdObject => Boolean(item));
}
