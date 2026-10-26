import { ENTITY_IDS } from './constants';
import type { AuthorJsonLdInput, JsonLdObject } from './jsonLd';

export type ReviewCalloutData = {
  id: string;
  title: string;
  item: {
    type: 'Book' | 'Game' | 'Product' | 'SoftwareApplication';
    name: string;
    inLanguage?: string;
    url?: string;
    creator?: {
      type: 'Person' | 'Organization';
      name: string;
      url?: string;
    };
    publisher?: {
      name: string;
      url?: string;
    };
    bookEdition?: string;
    /** Publication date of the reviewed work, separate from the article date. */
    datePublished?: string;
  };
  rating: number;
  bestRating: number;
  worstRating: number;
  /** Editorial verdict accompanying the overall score, before the aspect reviews. */
  body?: string;
  aspects: Array<{
    id: string;
    label: string;
    rating: number;
    body: string;
  }>;
};

export type ReviewEntitiesInput = {
  review: ReviewCalloutData;
  canonical: string;
  publishedTime: string;
  authors: AuthorJsonLdInput[];
};

/** Accept calendar dates with year, month, or day precision, without inventing missing parts. */
export function isPublicationDate(value: string): boolean {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  if (year < 1) return false;
  if (!match[2]) return true;

  const month = Number(match[2]);
  if (month < 1 || month > 12) return false;
  if (!match[3]) return true;

  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1];
}

/** Display the reviewed work's date in English, preserving its recorded precision. */
export function formatPublicationDate(value: string): string {
  if (!isPublicationDate(value)) {
    throw new RangeError(`Invalid publication date: ${value}`);
  }

  const [year, month, day] = value.split('-');
  if (!month) return year;
  if (day) return `${day}/${month}/${year}`;

  const date = new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, 1);
  const monthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
  return `${monthLabel} ${year}`;
}

export function reviewEntities(input: ReviewEntitiesInput): JsonLdObject[] {
  const { review, canonical, publishedTime, authors } = input;
  const reviewId = `${canonical}#${review.id}`;
  const itemId = `${canonical}#${review.id}-item`;
  const isCreativeWork = review.item.type !== 'Product';
  const authorReferences = authors.map((author) => ({
    '@type': 'Person',
    '@id': author.entityId,
    name: author.name,
    url: author.url,
  }));
  const ratingScale = {
    bestRating: review.bestRating,
    worstRating: review.worstRating,
  };

  const aspectEntities: JsonLdObject[] = review.aspects.map((aspect) => {
    const aspectId = `${canonical}#${aspect.id}`;
    const ratingId = `${aspectId}-rating`;

    return {
      '@context': 'https://schema.org',
      '@type': 'WebPageElement',
      '@id': aspectId,
      url: aspectId,
      name: aspect.label,
      inLanguage: 'en',
      text: aspect.body,
      isPartOf: { '@id': reviewId },
      about: { '@id': itemId },
      mainEntity: {
        '@type': 'Rating',
        '@id': ratingId,
        url: ratingId,
        author: authorReferences,
        reviewAspect: aspect.label,
        ratingValue: aspect.rating,
        ...ratingScale,
        mainEntityOfPage: { '@id': aspectId },
      },
    };
  });

  const reviewEntity: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    '@id': reviewId,
    url: reviewId,
    name: review.title,
    inLanguage: 'en',
    datePublished: publishedTime,
    author: authorReferences,
    publisher: { '@id': ENTITY_IDS.organization },
    isPartOf: { '@id': `${canonical}#article` },
    itemReviewed: {
      '@type': review.item.type,
      '@id': itemId,
      name: review.item.name,
      ...(review.item.inLanguage ? { inLanguage: review.item.inLanguage } : {}),
      ...(review.item.url ? { url: review.item.url } : {}),
      ...(isCreativeWork && review.item.creator ? {
        creator: {
          '@type': review.item.creator.type,
          name: review.item.creator.name,
          ...(review.item.creator.url ? { url: review.item.creator.url } : {}),
        },
      } : {}),
      ...(isCreativeWork && review.item.publisher ? {
        publisher: {
          '@type': 'Organization',
          name: review.item.publisher.name,
          ...(review.item.publisher.url ? { url: review.item.publisher.url } : {}),
        },
      } : {}),
      ...(review.item.type === 'Book' && review.item.bookEdition ? {
        bookEdition: review.item.bookEdition,
      } : {}),
      ...(isCreativeWork && review.item.datePublished ? {
        datePublished: review.item.datePublished,
      } : {}),
    },
    reviewBody: [
      review.body?.trim(),
      ...review.aspects.map((aspect) => `${aspect.label}\n${aspect.body}`),
    ].filter(Boolean).join('\n\n'),
    reviewRating: {
      '@type': 'Rating',
      '@id': `${reviewId}-rating`,
      url: `${reviewId}-rating`,
      author: authorReferences,
      ratingValue: review.rating,
      ...ratingScale,
    },
    hasPart: aspectEntities.map((aspect) => ({ '@id': aspect['@id'] })),
  };

  return [reviewEntity, ...aspectEntities];
}
