---
title: "Alien Motion Tracker, Part 2: Fixing North in a Room Full of Lying Compasses"
description: "After making the Alien RPG motion tracker network more reliable, the next problem was stranger: indoors, every phone seemed to have its own idea of north."
publishDate: 2026-05-25
tags:
  - alien-rpg
  - alien-motion-tracker
  - dev-log
  - gm-tools
draft: true
---

## Working angle

The first motion tracker article ended with the next problem: contact-position accuracy. The network can deliver the signal more reliably, but delivery is not enough if every tracker disagrees about direction.

This article is about the absurd problem of trying to "fix north" for a table prop. Indoors, magnetic north is unreliable enough that two phones can disagree, drift, or point the alien toward different walls. Manual calibration can create a shared reference, but it risks killing the flow of play if it becomes a ritual the table has to manage.

The core Ludic problem is not only technical accuracy. It is finding a forgiving direction system that preserves the illusion without adding GM burden or player setup friction.

## Source ledger

- The previous article covered the first prototype, Godot, mobile sensors, the network rebuild, and responsive admin UI.
- It teased the next unresolved issue as compass drift and contact-position accuracy.
- Main problem: the motion tracker used magnetic north indoors, and that was terrible.
- The app needs a shared reference direction. If the GM places an echo north-east, every player tracker needs to agree what north-east means.
- Network resiliency still matters, but it is a supporting thread: the signal can arrive reliably while still pointing in the wrong direction.
- Manual calibration/reference can help, but calibration itself can break the game flow if it becomes too visible or demanding.
- The design target is a forgiving system: reliable enough to preserve player belief, light enough to stay out of the scene.

## Possible structure

### The signal arrived. The direction lied.

Bridge from Part 1: the network problem became more reliable, but the next failure was more embarrassing because it attacked the core fantasy of the prop.

### Why "north" is not as solid as it sounds

Explain magnetic north indoors in practical terms: phones are consumer devices, rooms are full of interference, and two compasses can disagree enough to ruin a shared tracker experience.

### The table problem, not the sensor problem

Show why this matters in play. If the echo appears in different directions on different devices, the tracker stops feeling like an instrument and starts feeling like a bug.

### Manual calibration helps, then creates a new problem

Introduce the reference/calibration approach. It can make devices agree, but it adds a setup step, and setup steps are dangerous for a prop meant to disappear into play.

### Building something forgiving

Explore the design goal: not perfect scientific orientation, but a stable shared reference that can survive real rooms, real phones, and real table behavior.

### The network had to become resilient too

Short supporting section: reliability is not one thing. Delivery, reconnection, state recovery, and direction agreement all need to work together.

### What this changed about the tracker

Land the progress and name what is still unresolved or being tested.

## Open questions

- How much of the exact calibration method should the article reveal now?
- Is the solution already chosen, or is this article about the design search?
- Should the network resiliency update be one short section or woven through the compass story?
- Do we have screenshots, diagrams, or a small calibration visual to use as the cover or inline media?
