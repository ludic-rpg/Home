import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { createServer } from 'vite';
import remarkReviewCallout, { splitReviewCallout } from '../src/lib/markdown/remark-review-callout.mjs';

const renderer = await createMarkdownProcessor({ remarkPlugins: [remarkReviewCallout], smartypants: false });
const server = await createServer({ configFile: false, server: { middlewareMode: true, ws: false }, optimizeDeps: { noDiscovery: true }, logLevel: 'silent', appType: 'custom' });
after(() => server.close());
const { reviewEntities, isPublicationDate, formatPublicationDate } = await server.ssrLoadModule('/src/lib/seo/review.ts');
const { blogPostingEntity } = await server.ssrLoadModule('/src/lib/seo/jsonLd.ts');

const metadata = { review: { id: 'book-review', item: { type: 'Book', name: 'A French rulebook', inLanguage: 'fr' } } };
const markdown = `Before the review.

> [!review] Ludo's rating
>
> **Overall: 2/5**
>
> ### Physical quality: 4/5
>
> Sturdy binding, **clear printing**, and [useful maps](/maps/).
>
> ### Content: 2/5
>
> Scattered rules.
>
> - Crafting takes searching.
> - The index helps.

After the review.`;

function render(source = markdown, frontmatter = metadata) {
  return renderer.render(source, { frontmatter: structuredClone(frontmatter) });
}

test('scores and prose have one source, while Markdown formatting survives', async () => {
  const result = await render();
  const review = result.metadata.frontmatter.ludicReview;
  assert.equal(review.rating, 2);
  assert.equal(review.body ?? '', '');
  assert.deepEqual(review.aspects.map((aspect) => aspect.rating), [4, 2]);
  assert.equal(review.aspects[0].body, 'Sturdy binding, clear printing, and useful maps.');
  assert.match(review.aspects[1].body, /Crafting takes searching\.\nThe index helps\./);
  const split = splitReviewCallout(result.code, review);
  assert.equal(split.bodyHtml, '');
  assert.match(split.before, /Before the review/);
  assert.match(split.after, /After the review/);
  assert.match(split.aspectHtml['book-review-physical-quality'], /<strong>clear printing<\/strong>/);
  assert.match(split.aspectHtml['book-review-physical-quality'], /href="\/maps\/"/);
  assert.match(split.aspectHtml['book-review-content'], /<ul>/);

  const changed = await render(markdown.replace('Overall: 2/5', 'Overall: 2.5/5'));
  assert.equal(changed.metadata.frontmatter.ludicReview.rating, 2.5);

  const hardBreak = await render(markdown.replace('Scattered rules.', 'Scattered rules.  \n> Still readable.'));
  assert.match(hardBreak.metadata.frontmatter.ludicReview.aspects[1].body, /Scattered rules\.\nStill readable\./);
  assert.match(hardBreak.code, /Scattered rules\.<br>/);
});

test('overall verdict prose keeps formatting and enters the Review once, before its aspects', async () => {
  const verdict = `> A **beautiful book**, but a poor read. See [my notes](/notes/).
>
> I would recommend it only to fans.
>
> - Strong packaging.
> - Weak presentation.`;
  const source = markdown.replace('> **Overall: 2/5**', `> **Overall: 2/5**\n>\n${verdict}`);
  const result = await render(source);
  const review = result.metadata.frontmatter.ludicReview;
  const body = 'A beautiful book, but a poor read. See my notes.\n\nI would recommend it only to fans.\n\nStrong packaging.\nWeak presentation.';
  assert.equal(review.body, body);
  assert.deepEqual(review.aspects.map((aspect) => aspect.rating), [4, 2]);

  const split = splitReviewCallout(result.code, review);
  assert.match(split.bodyHtml, /<strong>beautiful book<\/strong>/);
  assert.match(split.bodyHtml, /href="\/notes\/"/);
  assert.match(split.bodyHtml, /<ul>/);
  assert.match(split.bodyHtml, /<li>Strong packaging\.<\/li>/);
  assert.equal((split.bodyHtml.match(/I would recommend it only to fans\./g) || []).length, 1);
  assert.doesNotMatch(split.bodyHtml, /Before the review|After the review|Sturdy binding|Scattered rules/);
  assert.doesNotMatch(split.before + split.after + Object.values(split.aspectHtml).join(''), /beautiful book|recommend it only to fans|Strong packaging/);
  assert.match(split.before, /Before the review/);
  assert.match(split.after, /After the review/);

  const [entity] = reviewEntities({
    review,
    canonical: 'https://ludicrpg.com/blog/example/',
    publishedTime: '2026-10-25',
    authors: [],
  });
  assert.equal(entity.reviewBody, [
    body,
    ...review.aspects.map((aspect) => `${aspect.label}\n${aspect.body}`),
  ].join('\n\n'));
  assert.equal((entity.reviewBody.match(/I would recommend it only to fans\./g) || []).length, 1);
  assert.doesNotMatch(entity.reviewBody, /Before the review|After the review|<strong>|<li>/);
});

test('one editorial Review, explicit overall score, and separate named aspect Ratings', async () => {
  const result = await render();
  const review = result.metadata.frontmatter.ludicReview;
  const canonical = 'https://ludicrpg.com/blog/example/';
  const authors = [{ name: 'Ludovic Fleury', url: 'https://ludicrpg.com/about/ludo/', entityId: 'https://ludicrpg.com/#person' }];
  const graph = reviewEntities({ review, canonical, publishedTime: '2026-10-25', authors });
  assert.equal(graph.filter((node) => node['@type'] === 'Review').length, 1);
  assert.doesNotMatch(JSON.stringify(graph), /AggregateRating/);
  const overall = graph[0];
  assert.equal(overall.reviewRating.ratingValue, 2);
  assert.equal(overall.reviewRating.bestRating, 5);
  assert.equal(overall.reviewRating.worstRating, 1);
  assert.equal(overall.itemReviewed['@type'], 'Book');
  assert.equal(overall.itemReviewed.inLanguage, 'fr');
  assert.equal(overall.author[0].name, authors[0].name);
  assert.equal(overall.url, `${canonical}#book-review`);
  assert.equal(overall.isPartOf['@id'], `${canonical}#article`);
  assert.equal(overall.reviewBody, review.aspects.map((aspect) => `${aspect.label}\n${aspect.body}`).join('\n\n'));
  const [legacyReview] = reviewEntities({ review: { ...review, body: undefined }, canonical, publishedTime: '2026-10-25', authors });
  const [blankReview] = reviewEntities({ review: { ...review, body: '  ' }, canonical, publishedTime: '2026-10-25', authors });
  assert.equal(legacyReview.reviewBody, overall.reviewBody);
  assert.equal(blankReview.reviewBody, overall.reviewBody);
  for (const [index, aspect] of review.aspects.entries()) {
    const node = graph[index + 1];
    assert.equal(node['@type'], 'WebPageElement');
    assert.equal(node['@id'], `${canonical}#${aspect.id}`);
    assert.equal(node.mainEntity['@type'], 'Rating');
    assert.equal(node.mainEntity.reviewAspect, aspect.label);
    assert.equal(node.mainEntity.ratingValue, aspect.rating);
    assert.equal(node.text, aspect.body);
    assert.equal(node.about['@id'], overall.itemReviewed['@id']);
    assert.ok(overall.hasPart.some((part) => part['@id'] === node['@id']));
  }
  const article = blogPostingEntity({ headline: 'Example', description: 'Example', canonical, image: '/cover.png', publishedTime: '2026-10-25', authors, reviewId: overall['@id'], reviewedItemId: overall.itemReviewed['@id'] });
  assert.equal(article.hasPart['@id'], overall['@id']);
  assert.equal(article.about['@id'], overall.itemReviewed['@id']);
});

test('ordinary articles and unrelated Obsidian callouts are unaffected', async () => {
  const result = await render('> [!NOTE] A normal note\n>\n> Keep this.', {});
  assert.equal(result.metadata.frontmatter.ludicReview, undefined);
  assert.match(result.code, /<blockquote>/);
  assert.match(result.code, /\[!NOTE\]/);
  assert.equal(splitReviewCallout(result.code), null);
});

test('book credits and release date stay separate from review authorship and date', async () => {
  const detailed = structuredClone(metadata);
  Object.assign(detailed.review.item, {
    url: 'https://example.com/book',
    creator: { type: 'Organization', name: 'Modiphius Entertainment', url: 'https://modiphius.net/' },
    publisher: { name: 'Arkhane Asylum Publishing' },
    bookEdition: '2d20',
    datePublished: '2022-03',
  });
  const result = await render(markdown, detailed);
  const [review] = reviewEntities({
    review: result.metadata.frontmatter.ludicReview,
    canonical: 'https://ludicrpg.com/blog/example/',
    publishedTime: '2026-10-25',
    authors: [{ name: 'Ludovic Fleury', url: 'https://ludicrpg.com/about/ludo/', entityId: 'https://ludicrpg.com/#person' }],
  });
  assert.equal(review.author[0].name, 'Ludovic Fleury');
  assert.equal(review.datePublished, '2026-10-25');
  assert.notEqual(review.publisher.name, 'Arkhane Asylum Publishing');
  assert.equal(review.itemReviewed.creator['@type'], 'Organization');
  assert.equal(review.itemReviewed.creator.name, 'Modiphius Entertainment');
  assert.equal(review.itemReviewed.publisher.name, 'Arkhane Asylum Publishing');
  assert.equal(review.itemReviewed.publisher['@type'], 'Organization');
  assert.equal(review.itemReviewed.bookEdition, '2d20');
  assert.equal(review.itemReviewed.datePublished, '2022-03');
  assert.equal(review.itemReviewed.url, 'https://example.com/book');
});

test('publication date display preserves known precision and rejects invalid calendar dates', () => {
  assert.equal(formatPublicationDate('2022'), '2022');
  assert.equal(formatPublicationDate('2022-03'), 'March 2022');
  assert.equal(formatPublicationDate('2022-03-04'), '04/03/2022');
  assert.equal(isPublicationDate('2024-02-29'), true);
  for (const date of ['2022-02-29', '2022-04-31', '2022-13', '2022-00', '0000', '2022-03-00', '04/03/2022']) {
    assert.equal(isPublicationDate(date), false, date);
    assert.throws(() => formatPublicationDate(date), RangeError);
  }
});

test('invalid scores or ambiguous identity fail instead of publishing misleading schema', async (t) => {
  // Astro logs parse failures before rejecting; these failures are intentional.
  t.mock.method(console, 'error', () => {});
  const cases = [
    [markdown, {}, /frontmatter needs/],
    ['No callout.', metadata, /exactly one/],
    [markdown + '\n\n' + markdown, metadata, /exactly one/],
    [markdown.replace('Overall: 2/5', 'Overall: 6/5'), metadata, /between 1 and 5/],
    [markdown.replace('Overall: 2/5', 'Overall: 2/10'), metadata, /Label: 2\/5/],
    [markdown.replace('Overall: 2/5', 'Average: 2/5'), metadata, /labelled Overall/],
    [markdown.replace('### Content:', '### Physical quality:'), metadata, /distinct/],
    [markdown.replace('### Content:', '### Item:'), metadata, /non-reserved/],
    [markdown.replace('### Content:', '## Content:'), metadata, /level-three/],
  ];
  for (const [source, frontmatter, message] of cases) {
    await assert.rejects(render(source, frontmatter), message);
  }
  const result = await render();
  assert.throws(() => splitReviewCallout('Missing component', result.metadata.frontmatter.ludicReview), /do not match/);
});
