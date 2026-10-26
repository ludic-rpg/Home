import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkCallouts from '../src/lib/markdown/remark-callouts.mjs';

const renderer = await createMarkdownProcessor({ remarkPlugins: [remarkCallouts], smartypants: false });

test('callouts preserve multiline body formatting and links without a title heading', async () => {
  const result = await renderer.render('> [!TIP] My **GM script**\n> Read the [introduction](https://example.com/intro/).\n> It has four scenes.\n>\n> Adapt the **story** for your table.');
  assert.match(result.code, /<aside class="article-callout" data-callout="tip">/);
  assert.match(result.code, /<p class="article-callout__title">My <strong>GM script<\/strong><\/p>/);
  assert.match(result.code, /<p>Read the <a href="https:\/\/example.com\/intro\/">introduction<\/a>\.\nIt has four scenes\.<\/p>/);
  assert.match(result.code, /<p>Adapt the <strong>story<\/strong> for your table\.<\/p>/);
  assert.doesNotMatch(result.code, /\[!TIP\]|<h[1-6]/);
  assert.deepEqual(result.metadata.headings, []);
});

test('blank-separated bodies and untitled supported callouts render', async () => {
  for (const kind of ['note', 'tip', 'info']) {
    const result = await renderer.render(`> [!${kind}]\n>\n> Keep this paragraph.\n>\n> - First item\n> - Second item`);
    assert.match(result.code, new RegExp(`data-callout="${kind}"`));
    assert.match(result.code, new RegExp(`<p class="article-callout__title">${kind[0].toUpperCase() + kind.slice(1)}</p>`));
    assert.match(result.code, /<p>Keep this paragraph\.<\/p>/);
    assert.match(result.code, /<ul>\n<li>First item<\/li>\n<li>Second item<\/li>/);
  }
});

test('ordinary quotes, unknown markers and review callouts stay unchanged', async () => {
  for (const source of ['> A normal **quote**.', '> [!warning] Be careful\n>\n> Preserve this.', '> [!review] Fallout\n>\n> Overall: 2/5']) {
    const result = await renderer.render(source);
    assert.match(result.code, /<blockquote>/);
    assert.doesNotMatch(result.code, /<aside|article-callout/);
  }
});
