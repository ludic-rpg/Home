import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://ludicrpg.com',
  integrations: [
    mdx(),
    sitemap({
      // The date-prefix → clean-URL mapping happens in
      // src/pages/blog/[...slug].astro, so the sitemap picks up public URLs.
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});
