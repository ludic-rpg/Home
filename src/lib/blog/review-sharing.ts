import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import type { CollectionEntry } from 'astro:content';
import type { ReviewCalloutData } from '../seo/review';
import { getBlogAuthors } from './authors';
import { blogSlug } from './posts';
import { getPostReview } from './reviews';
import { reviewSocialImageKey } from './review-social-image.mjs';

/** Generate only from local cover files; explicit social images retain priority. */
export async function getReviewSharingImage(post: CollectionEntry<'blog'>, parsedReview?: ReviewCalloutData) {
  if (!post.data.review || post.data.socialImage || !post.data.coverImage) return undefined;
  const cover = decodeURIComponent(post.data.coverImage);
  let root: string;
  let photoPath: string;
  if (cover.startsWith('./assets/') && post.filePath) {
    root = resolve(dirname(post.filePath), 'assets');
    photoPath = resolve(dirname(post.filePath), cover);
  } else if (cover.startsWith('/assets/')) {
    root = resolve('public/assets');
    photoPath = resolve('public', cover.slice(1));
  } else {
    return undefined;
  }
  const localPath = relative(root, photoPath);
  if (localPath === '..' || localPath.startsWith(`..${sep}`)) {
    throw new Error(`Review cover must stay within its assets folder: ${post.id}`);
  }
  const review = parsedReview ?? await getPostReview(post);
  if (!review) return undefined;
  const names = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
    .format(getBlogAuthors(post.data.authors).map((author) => author.displayName));
  const label = names ? `${names}'s rating` : 'Rating';
  const input = {
    photo: await readFile(photoPath),
    title: review.title,
    label,
    rating: review.rating,
    bestRating: review.bestRating,
  };
  const name = `${blogSlug(post)}-${reviewSocialImageKey(input)}`;
  return {
    name,
    url: `/social/reviews/${name}.png`,
    alt: `${review.title} review photograph with five stars at the top right: ${label}, ${review.rating} out of ${review.bestRating}.`,
    metadata: { width: 1200, height: 630, format: 'png' },
    input,
  };
}
