const DISCUSSION_KEY_PREFIX = 'reddit-discussion:';
const USER_AGENT = 'ludicrpg.com reddit discussion admin (contact: https://ludicrpg.com/contact)';

export async function onRequestPost(context) {
  const envCheck = requireEnv(context.env);
  if (envCheck) return envCheck;

  const authCheck = requireAdminToken(context.request, context.env);
  if (authCheck) return authCheck;

  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be JSON.' }, 400);
  }

  let redditUrl;
  try {
    redditUrl = normalizeRedditUrl(body.redditUrl, { requireLudicRpg: true });
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  let redditPost;
  try {
    redditPost = await fetchRedditPostMetadata(redditUrl);
  } catch (error) {
    return jsonResponse({ error: error.message }, 502);
  }

  const slug = blogSlugFromUrl(redditPost.linkUrl);
  if (!slug) {
    return jsonResponse({
      error: 'The Reddit post must be a link post pointing to a Ludic RPG blog article.',
      linkUrl: redditPost.linkUrl || null,
    }, 400);
  }

  const previous = await readDiscussion(context.env, slug);
  const redditCrossposts = await fetchCrosspostUrls(redditUrl);
  const articlePublishedAt = await fetchArticlePublishedAt(redditPost.linkUrl);
  const now = new Date().toISOString();
  const discussion = {
    version: 1,
    slug,
    redditUrl,
    redditCrossposts,
    articlePublishedAt,
    redditCreatedAt: redditPost.createdAt,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };

  await context.env.REDDIT_DISCUSSIONS.put(discussionKey(slug), JSON.stringify(discussion));

  return jsonResponse({
    ok: true,
    discussion,
  });
}

async function fetchRedditPostMetadata(redditUrl) {
  const redditJsonUrl = new URL(redditUrl);
  redditJsonUrl.pathname = redditJsonUrl.pathname.replace(/\/?$/, '.json');
  redditJsonUrl.search = 'raw_json=1';

  const response = await fetch(redditJsonUrl.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!response.ok) {
    throw new Error(`Could not fetch Reddit post (${response.status} ${response.statusText}).`);
  }

  const payload = await response.json();
  const post = payload?.[0]?.data?.children?.[0]?.data;
  if (!post) throw new Error('Could not read Reddit post metadata.');

  return {
    linkUrl: typeof post.url_overridden_by_dest === 'string'
      ? post.url_overridden_by_dest
      : typeof post.url === 'string'
        ? post.url
        : null,
    createdAt: Number.isFinite(Number(post.created_utc))
      ? new Date(Number(post.created_utc) * 1000).toISOString()
      : null,
  };
}

async function fetchArticlePublishedAt(articleUrl) {
  if (typeof articleUrl !== 'string') return null;

  try {
    const response = await fetch(articleUrl, {
      headers: {
        Accept: 'text/html',
        'User-Agent': USER_AGENT,
      },
    });
    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(/<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i)
      || html.match(/"datePublished"\s*:\s*"([^"]+)"/i);
    const publishedAt = match ? new Date(match[1]).toISOString() : null;
    return publishedAt;
  } catch {
    return null;
  }
}

async function fetchCrosspostUrls(primaryUrl) {
  const primaryId = redditPostId(primaryUrl);
  const duplicatesUrl = new URL(`https://www.reddit.com/duplicates/${primaryId}.json`);
  duplicatesUrl.searchParams.set('crossposts_only', '1');
  duplicatesUrl.searchParams.set('limit', '100');
  duplicatesUrl.searchParams.set('raw_json', '1');

  const response = await fetch(duplicatesUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!response.ok) return [];

  const payload = await response.json();
  const urls = new Set();
  for (const child of payload?.[1]?.data?.children || []) {
    const permalink = child?.data?.permalink;
    if (typeof permalink !== 'string') continue;
    try {
      urls.add(normalizeRedditUrl(`https://www.reddit.com${permalink}`));
    } catch {
      // Ignore malformed Reddit data instead of failing the admin save.
    }
  }
  return [...urls].filter((url) => url !== primaryUrl);
}

async function readDiscussion(env, slug) {
  const value = await env.REDDIT_DISCUSSIONS.get(discussionKey(slug), 'json');
  return value && typeof value === 'object' ? value : null;
}

function discussionKey(slug) {
  return `${DISCUSSION_KEY_PREFIX}${slug}`;
}

function blogSlugFromUrl(value) {
  if (typeof value !== 'string') return null;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, '');
  if (url.protocol !== 'https:' || hostname !== 'ludicrpg.com') return null;

  const match = url.pathname.match(/^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  return match ? match[1] : null;
}

function normalizeRedditUrl(value, { requireLudicRpg = false } = {}) {
  if (typeof value !== 'string') throw new Error('Reddit URL must be a string.');

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid Reddit URL: ${value}`);
  }

  const isReddit = url.hostname === 'reddit.com' || url.hostname.endsWith('.reddit.com');
  if (url.protocol !== 'https:' || !isReddit) {
    throw new Error('Reddit URL must be an https:// reddit.com URL.');
  }

  const match = url.pathname.match(/^\/r\/([^/]+)\/comments\/([a-z0-9]+)/i);
  if (!match) {
    throw new Error('Reddit URL must be a post URL like https://www.reddit.com/r/ludicRPG/comments/...');
  }
  if (requireLudicRpg && match[1].toLowerCase() !== 'ludicrpg') {
    throw new Error('The Reddit URL must be the original r/ludicRPG post.');
  }

  url.protocol = 'https:';
  url.hostname = 'www.reddit.com';
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname.replace(/\/?$/, '/');
  return url.toString();
}

function redditPostId(urlValue) {
  const url = new URL(urlValue);
  const match = url.pathname.match(/^\/r\/[^/]+\/comments\/([a-z0-9]+)/i);
  if (!match) throw new Error(`Could not extract Reddit post id from ${urlValue}`);
  return match[1];
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
