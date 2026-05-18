import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    teaser: z.string().optional(),
    publishDate: z.coerce.date(),
    coverImage: z.string().optional(),
    videoUrl: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    redditDiscussion: z.string().url().nullable().optional(),
  }),
});

export const collections = {
  blog,
};
