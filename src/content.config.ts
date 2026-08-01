import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { BLOG_AUTHOR_IDS } from './lib/blog/authors';

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
