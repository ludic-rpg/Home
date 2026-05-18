---
title: "I tried to build realistic air ducts and failed"
description: "Trying (and failing) to render 3D air ducts on a Ludic Field map for Alien RPG. The lesson: clarity beats realism for TTRPG schematics."
teaser: "Why did adding realistic air ducts to a TTRPG map viewer make me reinstall RollerCoaster Tycoon?"
publishDate: 2025-10-25
coverImage: "/assets/img/blog/realistic-air-ducts-failed/cover.jpg"
videoUrl: "https://youtu.be/sQ1iKM1CQoA"
videoTitle: "Novgorod Alien RPG Map: Why 3D Air Ducts Failed"
videoDescription: "A Ludic Field test for an Alien RPG station map, exploring why realistic 3D air ducts looked cool but made the TTRPG schematic harder to read at the table."
videoUploadDate: 2026-05-18
videoDuration: "PT7S"
tags: ["ludic-field", "ttrpg-map", "dev-log"]
draft: false
---

Spent many hours trying to display the air duct and shaft system on the Ludic Field project, for a map made by another contributor on the Alien universe. It’s a tricky one. His map introduces a concept of overhead and underfloor crawlspace, which is a great addition to the map and gameplay, but a real challenge to visualize.

I tried working with the isometric mode, which led me into some heavy math to connect all the pipes together. Guess what, I suck at math (even more in 3D). Drawing the network itself was easy. Making it connect seamlessly to the entry points was a different story. Since these maps are fan made for entertainment and not built to technical-grade accuracy like in AutoCAD, many entry points ended up slightly off or completely disconnected from the network.

So I started experimenting with a compensation system that could detect an entry point’s position, find the nearest tunnel, and calculate a realistic joint in 3D space. That turned into quite a ride. I won’t go into detail about all the different attempts (starting from the entry point, starting from the tunnel, drawing circles and triangles to angle properly), but I finally had something that looked smooth and correct. The disappointment came right after, confirming my first intuition when I started this experiment: when you combine vertical and horizontal tunnels in isometric view, everything overlaps and becomes confusing to read.

That wasn’t really a surprise. I reinstalled City Skylines and RollerCoaster Tycoon to see how they handle underground or elevated networks like rides, metros, highways, and utility pipes. It’s just as messy there. Even those games struggle to make it clear.

So I looked at how it’s done in the real world. Electricians and architects handle networks on 2D top-down plans with simple symbols and markings to show what goes above or below. It’s old-school, but it works. Clarity wins over realism.

I learnt a few things painfully, and I'm switching toward 2D visualization now.
