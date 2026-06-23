import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkLinkIcons from './src/lib/markdown/remark-link-icons.mjs';

export default defineConfig({
  site: 'https://ludicrpg.com',
  markdown: {
    remarkPlugins: [remarkLinkIcons],
  },
  integrations: [
    sitemap({
      // The date-prefix → clean-URL mapping happens in
      // src/pages/blog/[...slug].astro, so the sitemap picks up public URLs.
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});
