const REVIEW_MARKER = /^\[!review\](?:\s+(.+))?$/i;
const ANCHOR = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const ITEM_TYPES = new Set(['Book', 'Game', 'Product', 'SoftwareApplication']);

function plainText(node) {
  if (node.type === 'break') return '\n';
  if (node.type === 'image') return node.alt || '';
  if (typeof node.value === 'string') return node.value;
  const separator = ['list', 'listItem', 'blockquote', 'table', 'tableRow'].includes(node.type) ? '\n' : '';
  return (node.children || []).map(plainText).join(separator);
}

function aspectSlug(label) {
  return label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function fail(file, message, node) {
  file.fail(`Review callout: ${message}`, node);
}

function score(text, file, node) {
  const match = text.match(/^(.+?):\s*(\d+(?:\.\d+)?)\s*\/\s*5$/);
  if (!match) fail(file, 'use "Label: 2/5" for each score.', node);
  const rating = Number(match[2]);
  if (rating < 1 || rating > 5) fail(file, 'scores must be between 1 and 5.', node);
  return { label: match[1].trim(), rating };
}

/** Keep prose and scores in a native Obsidian callout, with identity in frontmatter. */
export default function remarkReviewCallout() {
  return (tree, file) => {
    const frontmatter = file.data.astro.frontmatter;
    const blocks = tree.children.filter((node) => node.type === 'blockquote'
      && node.children[0]?.type === 'paragraph'
      && REVIEW_MARKER.test(plainText(node.children[0]).trim()));
    if (!blocks.length && !frontmatter.review) return;
    if (blocks.length !== 1) fail(file, 'provide exactly one top-level [!review] callout when review metadata is set.', tree);

    const block = blocks[0];
    const config = frontmatter.review;
    if (!config || !ANCHOR.test(config.id || '') || !ITEM_TYPES.has(config.item?.type)
      || typeof config.item?.name !== 'string' || !config.item.name.trim()) {
      fail(file, 'frontmatter needs review.id (kebab-case) and review.item with type and name.', block);
    }

    const title = plainText(block.children[0]).trim().match(REVIEW_MARKER)[1] || config.item.name;
    const overallNode = block.children[1];
    if (overallNode?.type !== 'paragraph') fail(file, 'put "Overall: 2/5" in its own paragraph after the callout title.', block);
    const overall = score(plainText(overallNode).trim(), file, overallNode);
    if (overall.label.toLowerCase() !== 'overall') fail(file, 'the first score must be labelled Overall.', overallNode);

    const bodyNodes = [];
    const groups = [];
    const anchors = new Set([config.id, `${config.id}-title`, `${config.id}-item`, `${config.id}-rating`]);
    for (const node of block.children.slice(2)) {
      if (node.type === 'heading' && node.depth === 3) {
        const aspect = score(plainText(node).trim(), file, node);
        const slug = aspectSlug(aspect.label);
        if (!slug) fail(file, 'category labels must contain letters or numbers.', node);
        const id = `${config.id}-${slug}`;
        const ids = [id, `${id}-title`, `${id}-rating`];
        if (ids.some((anchor) => anchors.has(anchor))) fail(file, 'category labels must have distinct, non-reserved anchors.', node);
        ids.forEach((anchor) => anchors.add(anchor));
        groups.push({ ...aspect, id, nodes: [] });
      } else {
        if (node.type === 'heading') fail(file, 'use level-three headings for categories; keep their review text as paragraphs or lists.', node);
        if (groups.length) groups.at(-1).nodes.push(node);
        else bodyNodes.push(node);
      }
    }
    if (!groups.length) fail(file, 'include at least one category with review text.', block);

    const aspects = groups.map(({ nodes, ...aspect }) => {
      const body = nodes.map(plainText).join('\n\n').trim();
      if (!body) fail(file, `add review text for ${aspect.label}.`, block);
      return { ...aspect, body };
    });
    const body = bodyNodes.map(plainText).join('\n\n').trim();
    if (bodyNodes.length && !body) fail(file, 'add text for the overall verdict or omit it.', block);

    frontmatter.ludicReview = {
      id: config.id, title, item: config.item,
      rating: overall.rating, bestRating: 5, worstRating: 1, aspects,
      body,
    };

    // These build-time wrappers are consumed by BlogPostLayout. The actual UI is
    // the Astro component; Markdown still passes through the normal renderer.
    block.data = { hName: 'ludic-review', hProperties: { 'data-review-id': config.id } };
    block.children = [
      ...(bodyNodes.length ? [{
        type: 'blockquote',
        data: { hName: 'ludic-review-body' },
        children: bodyNodes,
      }] : []),
      ...groups.map((group) => ({
        type: 'blockquote',
        data: { hName: 'ludic-review-aspect', hProperties: { 'data-aspect-id': group.id } },
        children: group.nodes,
      })),
    ];
  };
}

/** Extract rendered review HTML without reparsing or flattening its Markdown. */
export function splitReviewCallout(html, review) {
  if (!review) return null;
  const pattern = /<ludic-review data-review-id="([^"]+)">([\s\S]*?)<\/ludic-review>/g;
  const blocks = [...html.matchAll(pattern)];
  if (blocks.length !== 1 || blocks[0][1] !== review.id) {
    throw new Error('Review callout markup and metadata do not match.');
  }
  const [block] = blocks;
  const bodies = [...block[2].matchAll(/<ludic-review-body>([\s\S]*?)<\/ludic-review-body>/g)];
  if (bodies.length !== (review.body ? 1 : 0)) {
    throw new Error('Review body markup and metadata do not match.');
  }
  const matches = [...block[2].matchAll(/<ludic-review-aspect data-aspect-id="([^"]+)">([\s\S]*?)<\/ludic-review-aspect>/g)];
  if (matches.length !== review.aspects.length || matches.some((match, index) => match[1] !== review.aspects[index].id)) {
    throw new Error('Review category markup and metadata do not match.');
  }
  return {
    before: html.slice(0, block.index),
    after: html.slice(block.index + block[0].length),
    bodyHtml: bodies[0]?.[1] ?? '',
    aspectHtml: Object.fromEntries(matches.map((match) => [match[1], match[2]])),
  };
}
