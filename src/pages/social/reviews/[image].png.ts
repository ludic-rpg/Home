import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getReviewSharingImage } from '../../../lib/blog/review-sharing';
import { renderReviewSocialImage } from '../../../lib/blog/review-social-image.mjs';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => (
    (import.meta.env.DEV || !data.draft) && Boolean(data.review && data.coverImage && !data.socialImage)
  ));
  const images = await Promise.all(posts.map((post) => getReviewSharingImage(post)));
  return images.filter((image) => image !== undefined).map((image) => ({
    params: { image: image.name },
    props: { input: image.input },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderReviewSocialImage(props.input);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
