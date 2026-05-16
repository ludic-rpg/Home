import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

const DATE_PREFIX = /^\d{2}-\d{2}-\d{2}_/;

export async function GET(context) {
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  return rss({
    title: 'Ludic RPG Blog',
    description:
      'Tools, props, and modern RPG maps for sci-fi and futuristic TTRPG campaigns. Building Ludic Field, motion tracker apps, and Alien RPG experiences.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      // Strip the YY-MM-DD_ filename prefix so the link matches the public URL.
      link: `/blog/${post.slug.replace(DATE_PREFIX, '')}/`,
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}
