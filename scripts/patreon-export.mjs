#!/usr/bin/env node
/**
 * Patreon → local export.
 *
 * Pulls every post from your campaign via the Patreon v2 API and writes
 * one JSON file per post into ../patreon-export/.
 *
 * SETUP (one-time)
 *   1. Open https://www.patreon.com/portal/registration/register-clients
 *   2. Click "Create Client" — name/description can be anything ("ludo-export"),
 *      redirect URI can be http://localhost (it's never actually used here).
 *   3. After creating the client, the page shows a "Creator's Access Token"
 *      — that's the only string you need. Copy it.
 *
 * RUN
 *   PATREON_TOKEN="paste-token-here" node scripts/patreon-export.mjs
 *
 * That's it. The script paginates through every post in your campaign,
 * downloads title/body/published_at/url/etc., and writes ../patreon-export/<id>.json.
 * Image URLs inside post bodies are preserved as-is (we'll handle download
 * separately).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const TOKEN = process.env.PATREON_TOKEN;
if (!TOKEN) {
  console.error('ERROR: set PATREON_TOKEN env var. See the comment at the top of this file.');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'patreon-export');

const API = 'https://www.patreon.com/api/oauth2/v2';
// Note: Patreon v2 rejects teaser_text / post_type / post_metadata on the
// `post` type, so they're omitted. These are the fields that actually validate.
const POST_FIELDS = [
  'title',
  'content',
  'published_at',
  'url',
  'is_public',
  'is_paid',
  'embed_data',
  'embed_url',
].join(',');

async function api(path) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent': 'ludo-patreon-export/1.0',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Patreon API ${res.status} on ${path}: ${body.slice(0, 500)}`);
  }
  return res.json();
}

async function getCampaignId() {
  const data = await api('/identity?include=campaign&fields%5Bcampaign%5D=creation_name');
  const campaign = (data.included || []).find((x) => x.type === 'campaign');
  if (!campaign) {
    throw new Error(
      "No campaign found on this account. The token must belong to a Patreon creator (i.e. you, on LudicRPG).",
    );
  }
  console.log(`Campaign: ${campaign.attributes.creation_name || '(unnamed)'}  id=${campaign.id}`);
  return campaign.id;
}

async function fetchAllPosts(campaignId) {
  const posts = [];
  let cursor = null;
  let page = 0;
  while (true) {
    page += 1;
    const qs = new URLSearchParams({
      'fields[post]': POST_FIELDS,
      'page[count]': '50',
    });
    if (cursor) qs.set('page[cursor]', cursor);
    const data = await api(`/campaigns/${campaignId}/posts?${qs.toString()}`);
    for (const p of data.data || []) posts.push(p);
    console.log(`  page ${page}: +${(data.data || []).length} posts (total ${posts.length})`);
    cursor = data.meta?.pagination?.cursors?.next || null;
    if (!cursor) break;
  }
  return posts;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Output: ${OUT_DIR}`);
  const campaignId = await getCampaignId();
  console.log('Fetching posts…');
  const posts = await fetchAllPosts(campaignId);
  console.log(`Done. Writing ${posts.length} files…`);
  for (const p of posts) {
    const file = resolve(OUT_DIR, `${p.id}.json`);
    await writeFile(file, JSON.stringify(p, null, 2), 'utf8');
  }
  // Also write an index manifest so the next step has a single file to chew on.
  const manifest = posts.map((p) => ({
    id: p.id,
    title: p.attributes?.title,
    published_at: p.attributes?.published_at,
    url: p.attributes?.url,
    is_public: p.attributes?.is_public,
    is_paid: p.attributes?.is_paid,
  }));
  await writeFile(resolve(OUT_DIR, '_index.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote ${posts.length} posts + _index.json to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
