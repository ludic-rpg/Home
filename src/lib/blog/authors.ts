import { ENTITY_IDS, SITE_URL } from '../seo/constants';

export const BLOG_AUTHOR_IDS = ['ludo', 'krayorn'] as const;

export type BlogAuthorId = (typeof BLOG_AUTHOR_IDS)[number];

export type BlogAuthor = {
  id: BlogAuthorId;
  displayName: string;
  fullName: string;
  profilePath: string;
  profileUrl: string;
  entityId: string;
  avatarPath: string;
};

export type BlogAuthorReference = {
  name: string;
  url: string;
  entityId: string;
};

export const BLOG_AUTHORS = {
  ludo: {
    id: 'ludo',
    displayName: 'Ludo',
    fullName: 'Ludovic Fleury',
    profilePath: '/about/ludo/',
    profileUrl: `${SITE_URL}/about/ludo/`,
    entityId: ENTITY_IDS.person,
    avatarPath: '/assets/img/ludo-avatar.webp',
  },
  krayorn: {
    id: 'krayorn',
    displayName: 'Krayorn',
    fullName: 'Krayorn',
    profilePath: '/about/#krayorn',
    profileUrl: `${SITE_URL}/about/#krayorn`,
    entityId: ENTITY_IDS.krayorn,
    avatarPath: '/assets/img/krayorn-avatar.webp',
  },
} as const satisfies Record<BlogAuthorId, BlogAuthor>;

export function getBlogAuthors(authorIds: readonly BlogAuthorId[]): BlogAuthor[] {
  return authorIds.map((authorId) => BLOG_AUTHORS[authorId]);
}

export function blogAuthorReferences(authorIds: readonly BlogAuthorId[]): BlogAuthorReference[] {
  return getBlogAuthors(authorIds).map((author) => ({
    name: author.fullName,
    url: author.profileUrl,
    entityId: author.entityId,
  }));
}
