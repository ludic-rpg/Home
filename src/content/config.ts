import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    pattern: '**/post.{md,mdx}',
    base: './src/content/blog',
  }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      teaser: z.string().optional(),
      publishDate: z.coerce.date(),
      coverImage: z.string().optional(),
      videoUrl: z.string().url().optional(),
      videoTitle: z.string().optional(),
      videoDescription: z.string().optional(),
      videoUploadDate: z.coerce.date().optional(),
      videoDuration: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      redditDiscussion: z.string().url().nullable().optional(),
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
