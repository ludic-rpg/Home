import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { REVIEW_SOCIAL_VERSION, renderReviewSocialImage, reviewSocialImageKey } from '../src/lib/blog/review-social-image.mjs';

// Corners should disappear in a wide crop; the upper marker tests its focal point.
const photo = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="2880">
  <rect width="2160" height="2880" fill="#ffffff"/>
  <rect width="160" height="160" fill="#ff0000"/>
  <rect x="2000" width="160" height="160" fill="#00ff00"/>
  <rect y="2720" width="160" height="160" fill="#0000ff"/>
  <rect x="2000" y="2720" width="160" height="160" fill="#ffff00"/>
  <rect x="160" y="900" width="300" height="300" fill="#00ffff"/>
</svg>`)).png().toBuffer();
const input = { photo, title: 'Fallout', label: "Ludo's rating", rating: 2, bestRating: 5 };
const baseline = await renderReviewSocialImage(input);
const expectedPhoto = await sharp(photo)
  .resize(1200, 1600)
  .extract({ left: 0, top: 291, width: 1200, height: 630 })
  .png().toBuffer();

async function pixels(image) {
  return sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
}

function pixel({ data, info }, x, y) {
  const start = (y * info.width + x) * info.channels;
  return [...data.subarray(start, start + 3)];
}

function goldPixels(image, left, width) {
  let count = 0;
  for (let y = 60; y < 104; y++) {
    for (let x = left; x < left + width; x++) {
      const [red, green, blue] = pixel(image, x, y);
      if (red > 200 && green > 140 && blue < 130) count++;
    }
  }
  return count;
}

async function assertSameRegion(first, second, region) {
  assert.deepEqual(
    await sharp(first).extract(region).removeAlpha().raw().toBuffer(),
    await sharp(second).extract(region).removeAlpha().raw().toBuffer(),
  );
}

test('1200 x 630 PNG fills the frame with the photograph at the 50% 30% focal point', async () => {
  const metadata = await sharp(baseline).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  const image = await pixels(baseline);
  for (const [x, y] of [[0, 0], [1199, 0], [0, 629], [1199, 629]]) {
    assert.deepEqual(pixel(image, x, y), [255, 255, 255]);
  }
  assert.deepEqual(pixel(image, 200, 280), [0, 255, 255]);
  assert.deepEqual(pixel(image, 200, 400), [255, 255, 255]);
});

test('a square black strip supports the stars and reaches the right edge without changing the surrounding photograph', async () => {
  for (const region of [
    { left: 0, top: 0, width: 1200, height: 44 },
    { left: 0, top: 44, width: 860, height: 76 },
    { left: 0, top: 120, width: 1200, height: 510 },
  ]) {
    await assertSameRegion(baseline, expectedPhoto, region);
  }
  const image = await pixels(baseline);
  for (const [x, y] of [[860, 44], [1199, 44], [1199, 82], [1199, 119], [860, 119], [931, 64]]) {
    assert.ok(
      pixel(image, x, y).every((channel) => Math.abs(channel - 56) <= 1),
      `the black strip has 78% opacity at ${x}, ${y}`,
    );
  }
});

test('same inputs produce the same PNG bytes and content key', async () => {
  assert.equal(REVIEW_SOCIAL_VERSION, '9');
  assert.deepEqual(await renderReviewSocialImage({ ...input, photo: Buffer.from(photo) }), baseline);
  assert.match(reviewSocialImageKey(input), /^[a-f0-9]{64}$/);
  assert.equal(reviewSocialImageKey(input), reviewSocialImageKey({ ...input, photo: Buffer.from(photo) }));
});

test('every editorial field and the complete photo affect the content key', () => {
  const key = reviewSocialImageKey(input);
  const changedPhoto = Buffer.from(photo);
  changedPhoto[changedPhoto.length - 1] ^= 1;
  for (const change of [
    { title: 'Another game' }, { label: 'Another rating' },
    { rating: 2.5 }, { bestRating: 10 }, { photo: changedPhoto },
  ]) {
    assert.notEqual(reviewSocialImageKey({ ...input, ...change }), key);
  }
});

test('stars show filled, unfilled, and fractional ratings clearly', async () => {
  const image = await pixels(baseline);
  assert.ok(goldPixels(image, 884, 44) > 300, 'the first star is filled gold');
  assert.ok(goldPixels(image, 937, 44) > 300, 'the second star is filled gold');
  assert.equal(goldPixels(image, 990, 44), 0);
  assert.equal(goldPixels(image, 1043, 97), 0);

  let outlinePixels = 0;
  for (let y = 59; y < 105; y++) {
    for (let x = 989; x < 1035; x++) {
      const color = pixel(image, x, y);
      if ([241, 230, 207].every((channel, index) => Math.abs(color[index] - channel) < 5)) {
        outlinePixels++;
      }
    }
  }
  assert.ok(outlinePixels > 100, 'empty stars retain a legible light outline');

  const fractional = await renderReviewSocialImage({ ...input, rating: 2.5 });
  assert.notDeepEqual(fractional, baseline);
  const fractionalPixels = await pixels(fractional);
  assert.ok(goldPixels(fractionalPixels, 990, 22) > 100, 'a half rating fills the left half of the third star');
  assert.equal(goldPixels(fractionalPixels, 1012, 22), 0, 'the other half of the third star remains unfilled');
});

test('all five rating slots share the same star shape', async () => {
  const emptyStars = await renderReviewSocialImage({ ...input, rating: 0 });
  const slots = await Promise.all(Array.from({ length: 5 }, (_, index) =>
    sharp(emptyStars).extract({ left: 884 + index * 53, top: 60, width: 44, height: 44 })
      .removeAlpha().raw().toBuffer()));
  assert.equal(new Set(slots.map((slot) => slot.toString('base64'))).size, 1);
});

test('only proportional stars appear, without the label, title, or numeric score', async () => {
  assert.deepEqual(await renderReviewSocialImage({ ...input, title: 'Another title' }), baseline);
  assert.deepEqual(await renderReviewSocialImage({
    ...input, label: 'A & B <span foreground="red">rating</span>',
  }), baseline);
  assert.deepEqual(
    await renderReviewSocialImage({ ...input, rating: 4, bestRating: 10 }),
    baseline,
    'equivalent scores produce the same image because the numeric fraction is absent',
  );
});

test('invalid ratings and missing data fail before creating a misleading image', async () => {
  for (const change of [
    { rating: NaN }, { rating: Infinity }, { rating: -1 }, { rating: 6 },
    { bestRating: 0 }, { bestRating: NaN }, { title: ' ' }, { label: '' }, { photo: Buffer.alloc(0) },
  ]) {
    assert.throws(() => reviewSocialImageKey({ ...input, ...change }));
    await assert.rejects(renderReviewSocialImage({ ...input, ...change }));
  }
});
