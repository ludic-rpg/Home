import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { BLOG_AUTHOR_IDS } from './lib/blog/authors';
import { isPublicationDate } from './lib/seo/review';

const reviewWebUrl = z.string().url().refine((value) => /^https?:\/\//i.test(value), {
  message: 'Review links must use HTTP or HTTPS.',
});

const blog = defineCollection({
  loader: glob({
    pattern: ['**/[0-9][0-9]-[0-9][0-9]/*.md', '**/post.md'],
    base: './src/content/blog',
  }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      teaser: z.string().optional(),
      publishDate: z.coerce.date(),
      authors: z
        .array(z.enum(BLOG_AUTHOR_IDS))
        .min(1)
        .refine((authors) => new Set(authors).size === authors.length, {
          message: 'Authors must not contain duplicates.',
        }),
      canonicalUrl: z.string().url().optional(),
      coverImage: z.string().optional(),
      socialImage: z.string().optional(),
      socialImageAlt: z.string().optional(),
      videoUrl: z.string().url().optional(),
      videoTitle: z.string().optional(),
      videoDescription: z.string().optional(),
      videoUploadDate: z.coerce.date().optional(),
      videoDuration: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      review: z.object({
        id: z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
        item: z.object({
          type: z.enum(['Book', 'Game', 'Product', 'SoftwareApplication']),
          name: z.string().trim().min(1),
          inLanguage: z.string().min(2).optional(),
          url: reviewWebUrl.optional(),
          creator: z.object({
            type: z.enum(['Person', 'Organization']),
            name: z.string().trim().min(1),
            url: reviewWebUrl.optional(),
          }).optional(),
          publisher: z.object({
            name: z.string().trim().min(1),
            url: reviewWebUrl.optional(),
          }).optional(),
          bookEdition: z.string().trim().min(1).optional(),
          // This identifies the reviewed work's publication, not this article's publishDate.
          datePublished: z.string().refine(isPublicationDate, {
            message: 'Use a valid publication date as YYYY, YYYY-MM, or YYYY-MM-DD.',
          }).optional(),
        }).superRefine((item, ctx) => {
          if (item.bookEdition && item.type !== 'Book') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['bookEdition'],
              message: 'bookEdition is only supported for Book reviews.',
            });
          }

          if (item.type === 'Product') {
            for (const field of ['creator', 'publisher', 'datePublished'] as const) {
              if (item[field]) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  path: [field],
                  message: `${field} is only supported for Book, Game, and SoftwareApplication reviews.`,
                });
              }
            }
          }
        }),
      }).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.videoUrl) return;

      const requiredVideoFields = [
        'coverImage',
        'videoTitle',
        'videoDescription',
        'videoUploadDate',
      ] as const;

      for (const field of requiredVideoFields) {
        if (!data[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} is required when videoUrl is present.`,
          });
        }
      }
    }),
});

export const collections = {
  blog,
};
