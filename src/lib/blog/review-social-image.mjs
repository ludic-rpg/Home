import { createHash } from 'node:crypto';
import sharp from 'sharp';

// Bump when changing the composition, typography, or image encoding.
export const REVIEW_SOCIAL_VERSION = '9';

const WIDTH = 1200;
const HEIGHT = 630;
const GOLD = '#efbd63';
const STAR_ROW = { left: 884, top: 60, size: 44, step: 53 };

function validateInput({ photo, title, label, rating, bestRating }) {
  if (!Buffer.isBuffer(photo) || photo.length === 0) {
    throw new TypeError('A review social image needs a nonempty photo Buffer.');
  }
  for (const [name, text] of Object.entries({ title, label })) {
    if (typeof text !== 'string' || !text.trim()) {
      throw new TypeError(`A review social image needs a nonempty ${name}.`);
    }
  }
  if (!Number.isFinite(bestRating) || bestRating <= 0
    || !Number.isFinite(rating) || rating < 0 || rating > bestRating) {
    throw new RangeError('The rating must be between zero and a positive bestRating.');
  }
}

/** The complete source photo and rendered editorial fields determine the URL. */
export function reviewSocialImageKey(input) {
  validateInput(input);
  return createHash('sha256')
    .update(JSON.stringify([
      REVIEW_SOCIAL_VERSION,
      input.title,
      input.label,
      input.rating,
      input.bestRating,
    ]))
    .update('\0')
    .update(input.photo)
    .digest('hex');
}

function starPoints(size) {
  const outer = size / 2;
  const inner = outer * 0.46;
  return Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const radius = index % 2 ? inner : outer;
    return `${outer + Math.cos(angle) * radius},${outer + Math.sin(angle) * radius}`;
  }).join(' ');
}

function starsLayer(rating, bestRating) {
  const points = starPoints(STAR_ROW.size);
  const stars = Array.from({ length: 5 }, (_, index) => {
    const left = STAR_ROW.left + index * STAR_ROW.step;
    const fill = Math.max(0, Math.min(1, rating / bestRating * 5 - index));
    return `<g transform="translate(${left} ${STAR_ROW.top})">
      <defs><clipPath id="star-${index}"><rect width="${STAR_ROW.size * fill}" height="${STAR_ROW.size}"/></clipPath></defs>
      <g filter="url(#star-shadow)" stroke-linejoin="round">
        <polygon points="${points}" fill="none" stroke="#f1e6cf" stroke-width="2"/>
        <polygon points="${points}" fill="${GOLD}" stroke="${GOLD}" stroke-width="2" clip-path="url(#star-${index})"/>
      </g>
    </g>`;
  }).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs><filter id="star-shadow" x="-25%" y="-25%" width="150%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.8"/>
    </filter></defs>
    <rect x="860" y="44" width="340" height="76" fill="#000" fill-opacity="0.78"/>
    ${stars}
  </svg>`);
}

/**
 * Compose a full-frame 1200 x 630 photograph with stars on a right-edge strip.
 * The crop matches CSS object-position: 50% 30%, keeping the book title visible.
 * Filled and outlined stars express the score proportionally. Titles, reviewer
 * labels, and numeric scores stay in metadata rather than over the photograph.
 * @param {{photo: Buffer, title: string, label: string, rating: number, bestRating: number}} input
 * @returns {Promise<Buffer>}
 */
export async function renderReviewSocialImage(input) {
  validateInput(input);
  const { photo, rating, bestRating } = input;
  const resizedPhoto = await sharp(photo).rotate()
    .resize(WIDTH, HEIGHT, { fit: 'outside' })
    .flatten({ background: '#090e13' }).toColourspace('srgb')
    .raw().toBuffer({ resolveWithObject: true });
  return sharp(resizedPhoto.data, { raw: resizedPhoto.info })
    .extract({
      left: Math.round((resizedPhoto.info.width - WIDTH) / 2),
      top: Math.round((resizedPhoto.info.height - HEIGHT) * 0.3),
      width: WIDTH, height: HEIGHT,
    })
    .composite([
      { input: starsLayer(rating, bestRating), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
}
