#!/usr/bin/env node
import fs from 'node:fs';
import process from 'node:process';

loadDotenv();

const [redditUrl] = process.argv.slice(2);
const endpoint = process.env.LUDIC_REDDIT_DISCUSSION_API_URL
  || 'https://ludicrpg.com/api/reddit-discussion';
const token = process.env.LUDIC_REDDIT_DISCUSSION_ADMIN_TOKEN
  || process.env.REDDIT_DISCUSSION_ADMIN_TOKEN;

if (!redditUrl || ['-h', '--help'].includes(redditUrl)) {
  printUsage();
  process.exit(redditUrl ? 0 : 1);
}

if (!token) {
  console.error('Missing LUDIC_REDDIT_DISCUSSION_ADMIN_TOKEN.');
  console.error('Set it to the same value as the Cloudflare Pages REDDIT_DISCUSSION_ADMIN_TOKEN secret.');
  process.exit(1);
}

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ redditUrl }),
});

let payload;
try {
  payload = await response.json();
} catch {
  payload = null;
}

if (!response.ok) {
  const message = payload?.error || `${response.status} ${response.statusText}`;
  console.error(`Could not attach Reddit discussion: ${message}`);
  if (payload?.linkUrl) console.error(`Reddit link target: ${payload.linkUrl}`);
  process.exit(1);
}

const discussion = payload.discussion;
console.log(`Attached Reddit discussion to /blog/${discussion.slug}/`);
console.log(`redditUrl: ${discussion.redditUrl}`);
console.log(`redditCrossposts: ${discussion.redditCrossposts.length} URL(s)`);
for (const [index, url] of discussion.redditCrossposts.entries()) {
  console.log(`  ${index + 1}. ${url}`);
}

function printUsage() {
  console.error(`Usage:
  npm run blog:reddit -- <r/ludicRPG-reddit-link-post-url>

Example:
  npm run blog:reddit -- https://www.reddit.com/r/ludicRPG/comments/...

The Reddit post must be a link post pointing to https://ludicrpg.com/blog/<article-slug>/.
The script writes runtime metadata to Cloudflare KV through ${endpoint}.`);
}

function loadDotenv() {
  if (!fs.existsSync('.env')) return;

  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}
