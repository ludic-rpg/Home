# Ludic RPG Site Architecture

This document records the current public-site architecture direction for Ludic RPG.

The goal is to keep the site understandable for humans, useful for SEO, and flexible enough for Ludic work to grow across games, tools, articles, scenarios, props, events, and experiments.

## Core Principle

Canonical pages should be organized by the world, game, or tool people are looking for.

Collection pages should exist as alternate browsing views.

In practice:

- a visitor looking for Alien RPG should find everything Alien RPG from `/alien-rpg/`
- a visitor looking for Ludic Field should find the tool and related work from `/ludic-field/`
- a visitor looking for all finished work should browse `/projects/`
- a visitor looking for writing and updates should browse `/blog/`

The same piece of work can appear in several collections, but it should have one canonical URL.

## Canonical Hubs

Top-level hubs should represent strong search and user intents.

Planned structure:

```text
/
/alien-rpg/
/cops-rpg/
/ludic-field/
/projects/
/blog/
/about/
```

### `/alien-rpg/`

The hub for Alien RPG work.

It can include:

- motion tracker
- Erebos / Novgorod maps
- Weyland-Yutani props
- campaign videos
- Heart of Darkness writeups
- related blog posts
- links to Ludic Field maps used for Alien RPG

Example canonical pages:

```text
/alien-rpg/motion-tracker/
/alien-rpg/erebos-station-map/
```

### `/cops-rpg/`

The hub for C.O.P.S. RPG work.

It can include:

- campaign material
- scenarios
- NPC libraries
- props
- cards
- news/video material
- related blog posts

Example future pages:

```text
/cops-rpg/
/cops-rpg/scenarios/
/cops-rpg/props/
```

### `/ludic-field/`

The hub for Ludic Field.

Ludic Field is the map viewer and play surface. It can link to the live tool on `field.ludicrpg.com`, explain the concept, show use cases, and gather related releases, maps, and articles.

Example pages:

```text
/ludic-field/
/ludic-field/maps/
/ludic-field/blueprint/
```

## Collection Views

Collection views are useful, but they should not replace canonical hubs.

They answer a different user intent: browsing by content type.

### `/projects/`

All public work across universes and formats.

This can include:

- apps
- tools
- map viewers
- scenarios
- props
- event material
- campaign assets
- videos
- experiments that became usable resources

Important: `/projects/` is an index. It should link to canonical project pages, not duplicate them.

### `/blog/`

All posts, devlogs, release notes, postmortems, and behind-the-scenes articles.

Articles should keep their canonical URL under `/blog/`:

```text
/blog/building-the-alien-rpg-motion-tracker-immersion-without-friction/
/blog/behind-the-scenes-of-my-first-alien-rpg-campaign/
/blog/ludic-field-v0-2-release/
```

Do not force posts into universe folders such as `/alien-rpg/posts/...` as the primary structure. Many Ludic articles naturally overlap several topics: Alien RPG, Ludic Field, GM tools, props, dev logs, and campaign prep.

Instead, hubs should embed or link related posts.

## Cross-Linking Rule

One canonical home, many discovery paths.

Example:

```text
/alien-rpg/erebos-station-map/
```

This could be discoverable from:

- `/alien-rpg/`
- `/ludic-field/`
- `/projects/`
- `/blog/behind-the-scenes-of-my-first-alien-rpg-campaign/`
- tag pages such as `/blog/tags/alien-rpg/`

But the canonical page remains:

```text
/alien-rpg/erebos-station-map/
```

## Breadcrumb Direction

Breadcrumbs should follow the canonical page identity.

Examples:

```text
Home > Alien RPG > Motion Tracker
Home > Alien RPG > Erebos Station Map
Home > Ludic Field
Home > Projects
Home > Blog > Building the Alien RPG Motion Tracker
```

For cross-topic work, choose the breadcrumb based on the canonical URL, not every place where the page is linked.

## SEO Reasoning

This structure gives strong topical entry points without creating duplicate content.

It supports:

- Alien RPG search intent
- C.O.P.S. RPG search intent
- Ludic Field as a product/tool entity
- broad project browsing
- chronological blog browsing
- internal linking between articles and usable resources

It also keeps future growth clean. Ludic RPG can publish tools, scenarios, props, events, videos, and articles without needing to redesign the whole URL system every time a project crosses multiple niches.

## Working Summary

Use universe/tool hubs for canonical resources.

Use `/projects/` and `/blog/` as collection views.

Let hubs pull related posts and works together.

Keep each work at one canonical URL, even if it appears in several places.
