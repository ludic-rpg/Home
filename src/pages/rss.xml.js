import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getBlogAuthors } from '../lib/blog/authors';
import { blogUrl } from '../lib/blog/posts';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
      link: blogUrl(post),
      categories: post.data.tags,
      customData: getBlogAuthors(post.data.authors)
        .map((author) => `<dc:creator>${escapeXml(author.fullName)}</dc:creator>`)
        .join(''),
    })),
    xmlns: {
      dc: 'http://purl.org/dc/elements/1.1/',
    },
    customData: '<language>en-us</language>',
  });
}
