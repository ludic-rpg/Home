import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? 'https://ludicrpg.com';
  const lastmod = new Date().toISOString();

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>` +
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
      `<sitemap><loc>${origin}/sitemap-0.xml</loc><lastmod>${lastmod}</lastmod></sitemap>` +
      `</sitemapindex>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    },
  );
};
