import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkLinkIcons from './src/lib/markdown/remark-link-icons.mjs';
import remarkReviewCallout from './src/lib/markdown/remark-review-callout.mjs';
import remarkCallouts from './src/lib/markdown/remark-callouts.mjs';

export default defineConfig({
  site: 'https://ludicrpg.com',
  markdown: {
    remarkPlugins: [remarkReviewCallout, remarkCallouts, remarkLinkIcons],
    rehypePlugins: [remarkLinkIcons],
  },
  integrations: [
    sitemap({
      // The date-prefix → clean-URL mapping happens in
      // src/pages/blog/[...slug].astro, so the sitemap picks up public URLs.
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
});
