---
title: "Building the Alien RPG Motion Tracker: Immersion Without Friction"
description: "Building the Alien RPG motion tracker for smooth TTRPG play: network rebuild, multi-device UI, and a prop-like experience that stays out of the way."
teaser: "Why does making a phone go beep at the right time take 5,000 lines of code?"
publishDate: 2026-05-16
coverImage: "/assets/img/blog/building-alien-rpg-motion-tracker/cover.jpg"
videoUrl: "https://youtu.be/E70pABA1o7E"
tags:
  - alien-rpg
  - dev-log
  - gm-tools
draft: false
---

### The Origin

For my first in-person Alien campaign, I wanted the "exact" motion tracker from Aliens.

I could not find one, so I built my own.

At first, it was just a prop for my table. A fun thing to make the session feel closer to the movie.

Then I shared a short video demo on Reddit, and people immediately started asking if they could use it too.

That was encouraging, but the real test was still the campaign.

And at the table, it landed. My players loved it. The beeps, the sweep, the moment an echo appeared on screen. It did exactly what I wanted: it added tension without needing explanation.

That is when I stopped thinking of it as a one-off prototype.

### The Prototype Worked. Mostly.

The setup was simple: a GM, a player, two phones, same WiFi.

The player opened the app and got the tracker. Dark screen, green radar, pulsing sweep, that heartbeat-like scan sound.

Then: **BEEP.**

A contact appeared.

The player could turn with the phone, sweeping the room like in the movie, trying to find where the echo came from.

No menu. No buttons. No setup screen. Just the prop.

On the GM side, I opened an admin screen, tapped a direction and distance, and the contact appeared on the player tracker.

Most of the time.

That "most of the time" is why I am rebuilding it.

The prototype had two big issues:

- **Network stability:** sometimes the contact never reached the players.
- **Contact accuracy:** sometimes it appeared, but not where I intended.

For a prototype, that was fine. It proved the feeling.

For a release, it was not enough.

### Why I Used a Game Engine for a Phone Prop

I built the app with **Godot**, an open source game engine.

That might sound odd for a phone app, but the tracker is not really a normal app. It is closer to a tiny game object: animated, atmospheric, reactive, and synced between devices.

It needs a smooth radar, sound, motion, and local multiplayer behavior. A game engine made sense.

I could have gone native: Swift for iPhone, Kotlin for Android. But that means building and maintaining the same app twice.

Godot gave me one codebase, real-time animation, cross-platform export, and multiplayer tools.

The trade-off is that Godot 4 is still young. I had to learn GDScript. A lot of tutorials are still for Godot 3. Mobile examples are often desktop-first. And when I needed something specific, there was not always a plugin waiting for me.

So yes, it slowed me down.

But the choice still feels right. This app lives or dies by atmosphere and timing. Godot is good at that.

### The Network Problem

The promise is simple:

> The GM places a contact. Players see it. Immediately.

If that fails, the scene stumbles. The GM is already juggling description, rules, pacing, music, lighting, players talking over each other. The tracker cannot be one more thing to manage.

The prototype used **UDP broadcast** over local WiFi.

In plain terms: every phone is on the same WiFi, but the app does not need the internet. It uses the little private network created by your WiFi box, also called a router.

![Network schema showing the WiFi router between the Wide Area Network and the Local Area Network|697](/assets/img/blog/building-alien-rpg-motion-tracker/lan-wan-animated-schema.svg)

The router may be connected to the internet, but the tracker messages stay inside the local WiFi network. The GM phone and the player phone both talk to the router, not to the internet.

The GM phone sends a small message to everyone on that network. Any player phone listening can receive it.

![UDP broadcast schema showing the GM phone sending an echo message through the WiFi router to the player tracker|697](/assets/img/blog/building-alien-rpg-motion-tracker/udp-broadcast-animated-schema.svg)

That is why the prototype felt so seamless. The phones did not need to formally connect first. No account. No lobby. No pairing screen. You opened the app, and it was already the motion tracker.

Perfect for immersion.

The problem is that UDP broadcast has no real relationship between devices. It is like shouting across a room. Fast, convenient, but you do not know who heard you.

So a contact could never be received with no warning. If a phone locked, slept, or disconnected, it missed everything. I could keep sending the same message again and again, but that is not a real solution. Some networks limit broadcast traffic. Some phones ignore it more aggressively to save battery.

UDP broadcast is great for discovery. It is fragile for important game state.

So I changed the model.

The app now uses **TCP** for the actual connection. TCP establishes an explicit link between devices and keeps it alive.

The devices are aware of each other. They know they are talking together. Messages have receipts. If the connection breaks, they know.

That gives me the reliability I need, but it creates a new problem: setup.

If the GM has to create a server and the player has to manually connect to it, the magic is gone. You are not holding a tracker anymore. You are configuring software.

So I kept UDP broadcast, but only for the invisible part.

The GM opens the admin app. It silently starts a server.

The player opens the tracker. The radar appears immediately, already pulsing.

Behind the scenes, the GM device sends a tiny UDP message:

> Here is my server. Connect to it.

The player app catches it quietly, then establishes the solid TCP connection.

The player never sees that happen.

That matters because play is messy. Everyone may start in sync: GM raises phone, player raises phone, tracker starts. But then the GM describes the corridor, players discuss strategy, someone lowers the phone, someone locks it by accident.

The reliable connection is for that messy middle. It keeps the tracker alive after the initial trick.

For the player, the experience should still feel like the prototype.

Behind the scenes, it took about **5,000 new lines of code** to keep it that simple.

### “Works on My Phone” Is Not Enough

The tracker view already worked well on iPhone.

The admin panel did not.

I had rushed it for the prototype, and it mostly fit my iPhone 15 Pro. Good enough for my table. Not good enough for release.

The moment I tried other screens, the cracks showed: cut-off buttons, text under the camera notch, panels overflowing, menus too close to the home indicator.

Mobile screens are annoying in very concrete ways. Small phones, big phones, iPads, notches, rounded corners, portrait, landscape.

The fix was to stop designing for my screen.

Now the interface adapts. Controls stay away from notches and home indicators. Panels resize instead of spilling out. Buttons are big enough for thumbs.

It took a few bad attempts to get there, but the admin panel should now survive real devices.

### What's Next?

The rebuild is not done, but the base is much stronger.

The network is reliable. The admin panel adapts. The app is closer to something I can actually give to other tables.

Next comes the problem I kept postponing: **compass drift**.

Because even if the network works, the tracker still has to answer one brutal question:

> Do all phones agree where the echo is?

Right now, not always.

That one took me a few days to think through.

Next devlog.
