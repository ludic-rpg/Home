import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import faviconManifest from './src/data/link-favicons.json' with { type: 'json' };
import remarkLinkIcons from './src/lib/markdown/remark-link-icons.mjs';
import remarkReviewCallout from './src/lib/markdown/remark-review-callout.mjs';
import remarkCallouts from './src/lib/markdown/remark-callouts.mjs';

// Include the icon map in Astro's Markdown cache key so existing posts refresh too.
const linkIcons = [remarkLinkIcons, faviconManifest];

export default defineConfig({
  site: 'https://ludicrpg.com',
  markdown: {
    remarkPlugins: [remarkReviewCallout, remarkCallouts, linkIcons],
    rehypePlugins: [linkIcons],
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
