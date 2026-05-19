---
title: "Balancing cool and clarity"
description: "Vertical airshafts, multi-map support, and a hard rewrite for Ludic Field. When does 3D help your tabletop RPG session, and when does it just look cool?"
teaser: "How do you spend a whole night making something cool that might be useless?"
publishDate: 2025-10-27
coverImage: "/assets/img/blog/balancing-cool-and-clarity/cover.jpg"
videoUrl: "https://youtu.be/_CxQw67R0JQ"
videoTitle: "Novgorod Alien RPG Map: Balancing Cool and Clarity"
videoDescription: "A Ludic Field devlog video about vertical airshafts, 3D readability, and finding the line between cinematic sci-fi map detail and clear TTRPG table use."
videoUploadDate: 2026-05-18
videoDuration: "PT43S"
tags: ["ludic-field", "ttrpg-map", "dev-log"]
draft: false
---
Second attempt at representing air ducts for **Ludic Field**, and this time I finally got something decent going.

It’s kind of fun because, once again, everything is built from **SVG**, so I had to do some specific **3D tricks** to properly extrude the 2D drawings. This map connects **underfloor and overhead airshafts**, which makes it a nice addition for gameplay, but also a bit of a headache to implement.

Now the question is, **which version feels clearer?** The one shown in the video instantly reads as an airshaft, it looks expressive and cool with that bit of volume. But I also have another version, a flat one without any depth, that might actually be easier to read. Mixing 3D and 2D is always tricky. It’s a subtle balance that can quickly look off if not handled carefully.

Right now it’s still a small level, but on bigger ones things could get messy once everything starts crossing each other. Lots of edge cases I haven’t tested yet.

I’ll keep both versions for now and see how it goes. Still a few things to tweak on this map, but we’re getting closer.

The good part is, I had to add support for multiple maps along the way, with a simple map selector. So now the viewer can actually load external maps, which is pretty great.

Finally, that was the less exciting part, but I had to rewrite a big chunk of the code since it wasn’t really designed to be modular at first. Now the architecture is way more flexible and supports different modes like **isometric**, **navigation**, and more. So yeah, we’re in a much better place now.
