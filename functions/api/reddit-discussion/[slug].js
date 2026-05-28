const DISCUSSION_KEY_PREFIX = 'reddit-discussion:';
const STALE_TTL_SECONDS = 24 * 60 * 60;
const USER_AGENT = 'ludicrpg.com reddit discussion counter (contact: https://ludicrpg.com/contact)';
const SECOND = 1000;
const HOUR = 60 * 60 * SECOND;
const DAY = 24 * HOUR;
const CACHE_TIERS = [
  { maxAgeMs: 2 * DAY, ttlSeconds: 5 * 60 },
  { maxAgeMs: 7 * DAY, ttlSeconds: 15 * 60 },
  { maxAgeMs: 30 * DAY, ttlSeconds: 60 * 60 },
  { maxAgeMs: Infinity, ttlSeconds: 6 * 60 * 60 },
];

export async function onRequestGet(context) {
  const envCheck = requireEnv(context.env);
  if (envCheck) return envCheck;

  const slug = normalizeSlug(context.params.slug);
  if (!slug) return jsonResponse({ error: 'Invalid article slug.' }, 400);

  const discussion = await readDiscussion(context.env, slug);
  if (!discussion?.redditUrl) {
    return jsonResponse({ error: 'No Reddit discussion is attached to this article.' }, 404, {
      'Cache-Control': 'public, max-age=60',
    });
  }

  const urls = discussionUrls(discussion);
  const cachedCounts = discussion.counts;
  const now = Date.now();
  const countTtlSeconds = countTtlForDiscussion(discussion, now);
  const cachedAt = cachedCounts?.fetchedAt ? Date.parse(cachedCounts.fetchedAt) : Number.NaN;
  const countAgeMs = Number.isFinite(cachedAt) ? Math.max(0, now - cachedAt) : Infinity;
  const isFresh = countAgeMs < countTtlSeconds * SECOND;
  const isUsableStale = cachedCounts?.fetchedAt && now - Date.parse(cachedCounts.fetchedAt) < STALE_TTL_SECONDS * 1000;

  if (isFresh) {
    return jsonResponse(publicDiscussion(discussion, false), 200, {
      'Cache-Control': cacheControlForFreshCount(countTtlSeconds, countAgeMs),
    });
  }

  if (isUsableStale && typeof context.waitUntil === 'function') {
    context.waitUntil(refreshCounts(context.env, slug, discussion, urls));
    return jsonResponse(publicDiscussion(discussion, true), 200, {
      'Cache-Control': 'public, max-age=60',
    });
  }

  try {
    const refreshed = await refreshCounts(context.env, slug, discussion, urls);
    return jsonResponse(publicDiscussion(refreshed, false), 200, {
      'Cache-Control': cacheControlForFreshCount(countTtlForDiscussion(refreshed), 0),
    });
  } catch (error) {
    if (isUsableStale) {
      return jsonResponse(publicDiscussion(discussion, true), 200, {
        'Cache-Control': 'public, max-age=30',
      });
    }
    return jsonResponse({ error: 'Could not refresh Reddit discussion counts.' }, 502);
  }
}

export async function onRequestDelete(context) {
  const envCheck = requireEnv(context.env);
  if (envCheck) return envCheck;

  const authCheck = requireAdminToken(context.request, context.env);
  if (authCheck) return authCheck;

  const slug = normalizeSlug(context.params.slug);
  if (!slug) return jsonResponse({ error: 'Invalid article slug.' }, 400);

  await context.env.REDDIT_DISCUSSIONS.delete(discussionKey(slug));
  return jsonResponse({ ok: true });
}

async function refreshCounts(env, slug, discussion, urls) {
  const posts = await Promise.all(urls.map(fetchRedditPost));
  const visiblePosts = posts.filter(Boolean);
  if (visiblePosts.length === 0) throw new Error('No visible Reddit posts found.');

  const counts = {
    score: visiblePosts.reduce((sum, post) => sum + post.score, 0),
    comments: visiblePosts.reduce((sum, post) => sum + post.comments, 0),
    bestRedditUrl: bestRedditPost(visiblePosts)?.url || discussion.redditUrl,
    fetchedAt: new Date().toISOString(),
    posts: visiblePosts,
  };
  const refreshed = {
    ...discussion,
    counts,
    updatedAt: discussion.updatedAt || counts.fetchedAt,
  };

  await env.REDDIT_DISCUSSIONS.put(discussionKey(slug), JSON.stringify(refreshed));
  return refreshed;
}

async function fetchRedditPost(url) {
  const redditJsonUrl = new URL(url);
  redditJsonUrl.pathname = redditJsonUrl.pathname.replace(/\/?$/, '.json');
  redditJsonUrl.search = 'raw_json=1';

  const response = await fetch(redditJsonUrl.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!response.ok) return null;

  const payload = await response.json();
  const post = payload?.[0]?.data?.children?.[0]?.data;
  const score = Number(post?.score);
  const comments = Number(post?.num_comments);
  if (!Number.isFinite(score) || !Number.isFinite(comments)) return null;

  return {
    url,
    subreddit: typeof post?.subreddit === 'string' ? post.subreddit : undefined,
    score,
    comments,
  };
}

async function readDiscussion(env, slug) {
  const value = await env.REDDIT_DISCUSSIONS.get(discussionKey(slug), 'json');
  return value && typeof value === 'object' ? value : null;
}

function publicDiscussion(discussion, stale) {
  const preferredUrl = preferredRedditUrl(discussion);

  return {
    redditUrl: preferredUrl,
    primaryRedditUrl: discussion.redditUrl,
    redditCrossposts: discussion.redditCrossposts || [],
    bestRedditUrl: preferredUrl,
    score: discussion.counts?.score ?? null,
    comments: discussion.counts?.comments ?? null,
    posts: discussion.counts?.posts || [],
    fetchedAt: discussion.counts?.fetchedAt || null,
    cacheTtlSeconds: countTtlForDiscussion(discussion),
    stale,
  };
}

function countTtlForDiscussion(discussion, now = Date.now()) {
  const ageAnchor = Date.parse(
    discussion.articlePublishedAt
      || discussion.redditCreatedAt
      || discussion.createdAt
      || '',
  );

  if (!Number.isFinite(ageAnchor)) return CACHE_TIERS.at(-1).ttlSeconds;

  const ageMs = Math.max(0, now - ageAnchor);
  return CACHE_TIERS.find((tier) => ageMs < tier.maxAgeMs)?.ttlSeconds
    || CACHE_TIERS.at(-1).ttlSeconds;
}

function cacheControlForFreshCount(ttlSeconds, countAgeMs) {
  const remainingSeconds = Math.max(1, Math.floor(ttlSeconds - countAgeMs / SECOND));
  return `public, max-age=${remainingSeconds}`;
}

function discussionUrls(discussion) {
  return uniqueUrls([
    discussion.redditUrl,
    ...(Array.isArray(discussion.redditCrossposts) ? discussion.redditCrossposts : []),
  ].filter(Boolean));
}

function discussionKey(slug) {
  return `${DISCUSSION_KEY_PREFIX}${slug}`;
}

function normalizeSlug(value) {
  if (typeof value !== 'string') return null;
  const slug = value.trim();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null;
}

function uniqueUrls(values) {
  return [...new Set(values)];
}

function preferredRedditUrl(discussion) {
  return discussion.counts?.bestRedditUrl
    || bestRedditPost(discussion.counts?.posts || [])?.url
    || discussion.redditUrl;
}

function bestRedditPost(posts) {
  return posts.reduce((best, post) => {
    if (!best) return post;
    if (post.score > best.score) return post;
    if (post.score === best.score && post.comments > best.comments) return post;
    return best;
  }, null);
}

function requireEnv(env) {
  if (!env?.REDDIT_DISCUSSIONS) {
    return jsonResponse({ error: 'Missing REDDIT_DISCUSSIONS KV binding.' }, 500);
  }
  return null;
}

function requireAdminToken(request, env) {
  const expected = env.REDDIT_DISCUSSION_ADMIN_TOKEN;
  if (!expected) return jsonResponse({ error: 'Missing REDDIT_DISCUSSION_ADMIN_TOKEN secret.' }, 500);

  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (token !== expected) return jsonResponse({ error: 'Unauthorized.' }, 401);

  return null;
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}
