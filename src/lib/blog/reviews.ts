import { render, type CollectionEntry } from 'astro:content';
import type { ReviewCalloutData } from '../seo/review';

/** Read the same Markdown callout used by the article and its structured data. */
export async function getPostReview(post: CollectionEntry<'blog'>): Promise<ReviewCalloutData | undefined> {
  if (!post.data.review) return undefined;
  const { remarkPluginFrontmatter } = await render(post);
  return remarkPluginFrontmatter.ludicReview as ReviewCalloutData;
}
