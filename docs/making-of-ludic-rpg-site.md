# The Making of the New Ludic RPG Site

This is not a technical changelog.

It is the story of a website slowly becoming more honest with itself.

At the beginning, the Ludic RPG site already had the right material: the projects, the blog, the avatar, the footer, the strange little signals of a person building tabletop RPG experiences with too much care and not enough sleep. But the site still had places where the intention and the interface did not quite touch. Some blocks were too tight. Some cards were too small. Some links behaved like buttons. Some things were semantically correct-ish, but not really correct. Some funny lines wanted to be funny and accidentally became a little too spicy.

So we started pulling on threads.

And, as usual with websites, every thread was attached to another thread.

## The Site Is A Table

The guiding idea was not "make the website prettier."

The real question was closer to:

What should Ludic RPG feel like before anyone clicks anything?

Ludic RPG is about immersive RPG experiences. Not just props, maps, apps, videos, or blog posts as isolated objects. The real center is the table: the moment where something becomes visible, playable, shared, funny, tense, or memorable.

That principle quietly shaped the session.

When a card was too small, it was not only a layout issue. It meant the thing inside the card could not breathe. When the footer was too tall, it was not only spacing. It was a rhythm problem. When the avatar played one random clip instead of all clips, it felt less alive than it should. When a semantic heading was wrong, it was not only "HTML correctness." It was the page failing to say clearly what it was.

The site needed to behave more like a good GM aid:

- useful without getting heavy
- expressive without becoming loud
- playful without becoming confusing
- structured enough for machines, but still made for humans

That became the working compass.

## The Footer, Or The Strange Politics Of Tiny Links

The footer looked simple.

Naturally, it was not.

The first issue was rhythm. On desktop, the Community links felt good. The spacing between Discord, Reddit, YouTube, GitHub, and Patreon had the right pace. But the Navigate and Feeds columns had a different rhythm, so the footer looked like three sections from three slightly different websites standing next to each other pretending everything was fine.

So we matched the spacing.

Then the last divider before the copyright became a small design moment. Instead of a plain line, it became a gradient: dark on the left, brighter in the center, dark again on the right. A tiny theatrical curtain before the final "copyright Ludic RPG."

Then the copyright area was too tall. It was doing that classic footer thing where a tiny legal line takes the vertical space of a dramatic ending. So we made it small. Very small. Footer small. The way a copyright line should be: present, not performing.

Then semantics arrived.

The footer links became real lists inside real navigation landmarks. This is one of those invisible changes that most visitors will never notice directly, but screen readers and assistive tech absolutely do. A footer is not just a row of text. It has groups. Community links. Site navigation. Feeds. Those groups should be named.

And then, because HTML has a sense of humor, the Community links gained little list dots.

That happened because real lists have bullets by default. When you turn visual link groups into semantic lists, you also need to tell the browser: yes, thank you, I know this is a list, but please do not put a dot in front of Discord like it is a grocery item.

So the dots were removed.

Not globally. Only in the footer. Because a site should not solve one problem by quietly breaking every other list.

Small lesson: semantic HTML often reveals the browser's default opinions. Some of those opinions need a polite but firm no.

## The Alien Cards And The 264 Pixel Feeling

The homepage section around Alien RPG and C.O.P.S. had another problem: the cards were sometimes too small.

The magic number that emerged was around 264px. At that width, a card still felt like an object. Below that, it started to feel like a postage stamp with ambitions.

This is one of those design facts that is hard to define but easy to feel. A card is not only a rectangle. It is a promise: there is something inside worth looking at. If it gets too narrow, the image weakens, the title compresses, and the whole thing loses confidence.

But there was also the iPhone problem.

On a narrow phone, especially around 380px wide, the card cannot just demand 264px and ignore the world. So the layout had to become responsive in a more thoughtful way. Not "always three columns" or "always one column," but something more like:

Take the available space.
Try to preserve the ideal card width.
Wrap only when needed.
Do not let cards become sad little tiles.

That is the hidden work behind a layout that feels obvious when it is right.

Good responsive design is not about making things shrink. It is about knowing when they should stop shrinking.

## The Avatar Wanted To Live A Little

The avatar had its own small drama.

The behavior was too random. It played a random clip, but the better feeling was not randomness. The better feeling was variety over time.

If you have several avatar clips, the nice thing is not "surprise me with one of them forever." The nice thing is: let me eventually see them all.

So the thinking shifted from "pick a clip" to "cycle through clips intelligently." A tiny algorithmic difference, but a big difference in personality. The avatar stops feeling like a slot machine and starts feeling like a small library of moods.

That matches the whole Ludic idea: make things feel alive, but do not make the user manage them.

The user should not think, "I wonder if the randomizer is broken."
They should just feel that the avatar has moments.

## Spacing Between Big Homepage Moments

On desktop, the hero block, blog entry/avatar block, and spotlight block were a little too tight.

This is the kind of spacing problem that sounds minor until you see it.

Sections need air, especially when each section has a different role:

- the hero introduces the site
- the blog/avatar moment gives personality and recency
- the spotlight points to important work

If they sit too close together, the page starts speaking too quickly. The visitor does not get enough time to understand: new idea, new block, new invitation.

So we added a little more space on desktop, then applied the same final feeling to tablet.

This is one of the less glamorous design truths: sometimes the fix is not a new component, a new visual effect, or a new headline.

Sometimes the fix is oxygen.

## The Semantic Rabbit Hole

Then came the big question:

Is the homepage well marked up semantically?

That opened the door.

A website is not just what it looks like. It is also what it says to browsers, search engines, accessibility tools, screen readers, social cards, and future developers.

This is where words like `header`, `nav`, `main`, `section`, `article`, `h1`, and `h2` stop being abstract. They become the skeleton of the page.

The homepage needed clearer structure:

- the site header should be a real header
- the main navigation should be a real nav
- the homepage content should live inside main
- the hero should carry the main page promise
- the latest blog entry should be an article, not just a styled box
- project groups should be sections with names
- repeated cards should be list items, because they are a list
- footer link groups should be navigations, because they navigate

This work is mostly invisible, but it changes the site from "a visual composition" into "a document that knows what it is."

And then About broke.

## The About Bubble That Disappeared

The About page had a visual speech bubble:

Hi, I'm Ludo

The user did not want another title added there. No extra SEO block. No formal "About Ludic RPG Creator Ludovic Fleury" headline marching in with a clipboard.

The right move was to make the existing "Hi, I'm Ludo" become the real `h1`.

That was semantically clean and visually respectful.

Except the bubble disappeared.

Why?

Because the animation script still looked for an `h2`.

The page had changed from:

`h2: Hi, I'm Ludo`

to:

`h1: Hi, I'm Ludo`

But the little animation that reveals the bubble had not been told. It kept searching for the old heading. It never found it. The heading stayed invisible.

This is one of those perfect website moments:

The HTML was more correct.
The page was more broken.

The fix was simple: teach the script to look for either `h1` or `h2`.

The lesson was better: semantics and behavior are connected. Change the skeleton, and you may need to update the muscles.

## Breadcrumbs: Imagined, Regretted, Removed

At one point, we tried adding a small breadcrumb/context line in the site header.

The idea made sense on paper. On blog pages and tag pages, a little context could help orientation. Something like "Blog / tag page" or "Back to blog" near the logo.

In reality, it looked bad.

Not "needs tuning" bad.

Just bad.

So it was removed fully.

This is important. A design session is not only the list of things that survived. It is also the list of things that were tried and rejected because they made the site feel worse.

The breadcrumb had a logical purpose, but the site did not want it. The header already had enough work to do: logo, baseline, nav, social links. Adding more context there made it feel cluttered and slightly bureaucratic.

So the visible breadcrumb died.

The invisible breadcrumb data for search engines could stay where useful, but the human interface did not need to wear it.

Small lesson: not every helpful idea deserves a visible seat.

## Blog Posts Vanished, Except They Did Not

After semantic changes, the blog page seemed to lose its posts.

That sounded scary.

The built HTML still had the posts. The markup had twelve blog cards. But the local development server was choking when trying to load the blog collection.

Why?

Because the blog folder also contained Obsidian configuration files. They were hidden files in a `.obsidian` folder, and Astro was trying to treat some of them like blog posts.

Imagine a librarian trying to shelve a settings file between two articles.

It did not go well.

The fix was to make the blog collection stricter: only files named `post.md` or `post.mdx` count as blog posts.

That small rule matters because the site is also a writing workspace. Obsidian can live near the content, but the website needs to know what is article and what is workshop dust.

This is one of the hidden tech details behind a calm blog index:

The site is not just displaying posts.
It is filtering a working folder.
It has to ignore the tools used to write the posts.

When it does that correctly, the visitor never knows the problem existed.

Which is the point.

## The Code Of Conduct Became A Tiny Comedy Lab

The Code of Conduct page needed a better line.

The first line was:

Clear, simple, and fast to read.

Accurate, maybe. Alive, no.

So we tried alternatives.

One direction was direct and descriptive:

No ads, clear credit, honest AI use, and respectful support.

It said the right things. It also sounded a little like the subtitle of a responsible SaaS page.

Then came pop culture.

"Be excellent to each other." - Bill & Ted

That was warmer. Recognizable. Gentle. But maybe a little too expected.

Then came Wheaton's Law.

Funny, nerdy, known in internet culture, and very relevant to a Code of Conduct.

But spelling it out was borderline for a public page. It had the right lineage and the wrong smell. A bit too forum argument. A bit too "this page is about to moderate comments in 2009."

So we backed off.

Then the better direction emerged:

The usually skipped page, made suspiciously short.

That had the right spirit. Dry. Self-aware. It admits what everyone does with code of conduct pages: they skip them.

Finally it became:

The usually skipped page, made suspiciously short. TL;DR: Wheaton's Law

That line does several things at once:

- it jokes about the page being skipped
- it promises brevity
- it gives a nerd-culture wink
- it avoids putting the blunt version directly in the UI
- it matches the page's real structure: short, human, reciprocal

This was a good example of tone design.

Tone is not decoration. Tone tells visitors what kind of place they are in.

## Tags Are Links, Not Buttons

In blog articles, the tags looked like buttons.

But they were not actions. They were links to tag pages.

That difference matters.

A button says: do something here.
A link says: go somewhere related.

So the tags were restyled as plain metadata links. No chip border. No button padding. No fake control energy. Just small underlined links.

Then the spacing was still too large. The tags sat too far below the divider, like a shy footnote that had lost its way.

So we tightened the spacing.

Again, tiny detail. But tiny details carry meaning. If tags are metadata, they should sit close to the divider. They should feel attached to the article, not like a separate module.

This is the kind of design adjustment nobody celebrates, but everyone feels when it is wrong.

## The Hidden Things People Usually Never See

A lot of the session was about things visitors do not consciously notice.

They do not notice that a `nav` has an accessible name.

They do not notice that a card list is a real `ul`.

They do not notice that a footer link group no longer leaks bullet points.

They do not notice that a blog collection ignores Obsidian config files.

They do not notice that an avatar clip sequence is designed to show variety over time.

They do not notice that the page heading exists exactly once.

They do not notice that tags are no longer pretending to be buttons.

But they experience the result.

The site feels a little calmer. A little clearer. A little more intentional. Less like a pile of components and more like a place.

This is the funny thing about web craft:

When the work is bad, everyone sees it.
When the work is good, most of it disappears.

## What We Dropped

We dropped the visible breadcrumb in the header.

It was useful in theory and ugly in practice.

We dropped the fully explicit Wheaton's Law line.

It was funny, but too borderline for the page's public face.

We dropped the idea that semantic fixes are only "for machines."

They are for humans too. A page with better structure is easier to navigate, easier to maintain, easier to understand, and easier to trust.

We dropped the idea that responsive design is just shrinking things.

Sometimes responsive design means protecting a card from becoming too small.

We dropped the idea that random avatar clips are enough.

Variety is better when it has memory.

## What We Built

We refined the footer until it had better rhythm, a lighter copyright area, a subtle gradient divider, and proper semantic link groups.

We improved the homepage spacing so its main blocks have more room to land.

We tuned the project cards around an ideal width, instead of letting the layout crush them below their useful size.

We changed avatar playback thinking from random clip to all clips over time.

We audited and improved the site's semantic structure: headers, navs, mains, sections, articles, lists, headings.

We made About's existing "Hi, I'm Ludo" the real page title without adding a boring extra heading.

We removed the header breadcrumb after admitting it was bad.

We fixed the blog collection so Obsidian workspace files do not masquerade as posts.

We gave the blog index and tag pages clearer human and SEO-friendly titles.

We turned article tags back into what they really are: links.

We found a Code of Conduct tagline that feels like Ludic RPG:

The usually skipped page, made suspiciously short. TL;DR: Wheaton's Law

## The Real Story

The real story is not that the site got "optimized."

The real story is that the site became more aligned with the way Ludic RPG thinks.

Ludic RPG cares about the moment of play. It cares about friction. It cares about atmosphere. It cares about whether a tool helps or gets in the way. It cares about whether something feels alive without asking the user to operate it.

That same philosophy can apply to a website.

A footer can have friction.
A card can lose atmosphere.
A heading can fail to introduce the page.
A tag can pretend to be a button.
A hidden config file can break the blog.
A funny line can be almost right and still wrong.

The making of the new Ludic RPG site was not one big heroic redesign move.

It was a series of small negotiations:

between clarity and personality,
between SEO and human language,
between semantic structure and visual charm,
between desktop rhythm and phone constraints,
between jokes that land and jokes that bite,
between visible polish and invisible craft.

That is probably the most Ludic part of it.

The site is not just a container for the work.

It is another playable surface.

## The Blog Found Its Voice

The next pass started somewhere else entirely: languages.

The question was simple:

Could the current Ludic RPG site exist in both French and English?

The answer was yes, but not in the fake-simple way where you duplicate every
page and call it a day. A bilingual site is a small architecture choice hiding
inside a language choice. The site needs to know what language a page is in. A
blog post needs to know whether a translation exists. A language switcher needs
to point to the matching page, not just throw the visitor somewhere nearby and
hope they are polite about it.

We looked at two shapes:

```text
/en/
/fr/
```

and:

```text
/
/fr/
```

The first one is cleaner for code. Every language has a visible prefix. Very
tidy. Very symmetrical. Very pleasing to the part of the brain that likes little
drawers with labels.

The second one is gentler for the existing site. English already lives at `/`,
`/blog/`, and `/about/`. Moving it under `/en/` would mean redirects and a public
URL change. So the careful answer became: keep English where it is, put French
under `/fr/`, and do the language work properly later.

That was the first useful non-decision of the session.

Not every good idea needs to be implemented the moment it becomes clear. Some
ideas need to be understood, parked, and given their own pass.

Then we moved to a much smaller thing that somehow took more emotional energy:
the blog.

The blog collection page had an H1 that technically described the content:

```text
RPG Devlogs, Props & Table Experiments
```

It was not wrong.

That was the problem.

It sounded accurate in the way a storage label is accurate. Everything was in
there: RPG, devlogs, props, experiments. Useful words. Dead sentence.

The subtitle had the same problem:

```text
Behind-the-scenes notes on tools, props, maps, apps, and the small design choices
that make tabletop sessions feel more alive.
```

It was a small museum of keywords.

This is one of the traps of making a public site. You want search engines to
understand the page, so you start adding useful nouns. Then the page stops
talking like a person. The visible text begins to feel like it was written for a
machine that happens to tolerate humans.

We tried a more mission-shaped version:

```text
Making RPG sessions feel more alive
```

Better, but still too broad.

Then we touched the phrase that had to die:

```text
Follow my journey
```

It had the right intention and the wrong smell. Too generic. Too influencer. Too
much like the website had briefly put on a linen shirt and started talking about
personal branding.

The title finally became simpler:

```text
Ludic Blog
```

No trick. No stack of keywords. Just the place.

The subtitle became the real battleground.

We tried versions that were too listy:

```text
A mostly fun journey through build notes, table tests, tools, props, maps, apps,
and the small choices that make RPG sessions feel more alive.
```

We tried versions that were more human, but still a little heavy:

```text
A mostly fun journey through the things I build for my tables, what breaks,
what works, and what sometimes makes the game feel a little more alive.
```

Then the voice started to show up:

```text
Where the fun usually starts with a bad idea.
```

Funny, but maybe too harsh on the work.

Then:

```text
Where questionable ideas produce unexpected fun.
```

Good meaning. Slightly too mechanical.

Finally:

```text
Where unexpected fun starts with questionable ideas.
```

That one stayed.

It works because it has a little reveal inside it. It starts with the good part:
unexpected fun. Then it reveals the suspicious origin: questionable ideas.

It does not say the ideas are bad. It says they are maybe impractical, slightly
too much, possibly unnecessary, and therefore very much worth trying at a table.

That is Ludic RPG in one small sentence.

The work often begins with a "what if?" that is not obviously reasonable:

- what if a motion tracker became an actual table object?
- what if a map was not just shown, but shared as a playable surface?
- what if a prop made a fictional thing feel close enough to touch?
- what if a website could carry some of that same playful suspicion?

Then came the part people rarely talk about: spacing.

The words were better, but the block still felt wrong. The H1 and subtitle were
too close to the cards below. On desktop, the bottom padding was not enough. The
page had the right line and still landed badly.

Spacing is part of the voice.

Too much and the site becomes dramatic about itself. Too little and everything
feels rushed. The blog header needed room to land before the cards started
speaking.

But the fix had to be careful. The site already had shared header styles. A
casual change to `.page-header` could fix the blog and quietly damage tag pages,
Markdown pages, or other headings.

So the blog index got its own scoped class:

```text
.blog-index-header
```

That is the boring name of a very important idea: fix the thing you mean to fix,
not every thing that happens to look similar.

The last small negotiation was the blog cards.

The tags were useful, but they were sitting too high in the card. They looked
important in a way they were not. Tags are metadata. They help people browse,
but they should not interrupt the title and description.

So they moved downstairs.

Before:

```text
Title
Tags
Description
Read more
```

After:

```text
Title
Description
Tags                         Read more
```

The tags now sit on the same line as `Read more ->`, aligned left, more dimmed.
The call to action keeps the right edge. The card becomes calmer.

It is a tiny change, but it changes the reading rhythm. The title gets to be the
title. The description gets to breathe. The tags become what they should have
been all along: quiet little doors.

There was also one failed experiment worth keeping in the story.

We tried to redesign the blog post CTA: make Discord primary, make Reddit and
YouTube secondary, turn the ending into a more intentional invitation. On paper,
that sounded reasonable.

On the page, it was terrible.

Not broken. Worse: fake.

It sounded like a website pretending to be charming. So it was reverted.

That is a useful kind of failure. Some ideas only reveal themselves after they
exist. The important thing is not to defend them just because they took effort.

By the end, the actual visible changes were small:

- the blog index says `Ludic Blog`
- the subtitle says `Where unexpected fun starts with questionable ideas.`
- the header has more breathing room
- the blog header styling is scoped so other H1s are safe
- tags moved into the card footer beside `Read more ->`
- the tags are quieter
- the same card pattern applies on the blog index and tag pages

But the real work was not the list.

The real work was making the site sound less like a catalog and more like the
person behind it.

The hidden technical layer is still there: Astro components, Markdown posts,
frontmatter, RSS, sitemap, structured data, canonical URLs, future `hreflang`
for languages, all the little machines that make a simple page behave properly.

But the visible layer now does something more important.

It gives the reader permission to understand Ludic RPG the right way:

this is not a polished product showroom.

It is where questionable ideas are tested until some of them become unexpected
fun.

---

## Session Addendum: The Round Of Small Invisible Things

This later pass was not about inventing a new website from scratch.

It was about making the existing site less accidental.

The funny thing is that most of the work happened in places visitors are not
supposed to consciously notice: the distance between footer links, the way tags
look at the end of an article, whether a card gets too narrow before wrapping,
whether an avatar feels random or alive, whether the page title is a real title
or just a big sentence wearing CSS.

That is a strange kind of craft. If it works, people do not say, "ah yes, the
semantic sectioning is improved." They just feel less friction.

### The Footer Became A Social Creature

The footer started with a tiny complaint: Community links felt good, but Navigate
and Feeds did not have the same rhythm.

That sounds ridiculous until you look at a footer long enough. Then it becomes
obvious. One column walks. Another limps.

So the spacing was matched. Then the last divider became a small gradient: dark
on the sides, bright in the center. Then the copyright stopped taking too much
height, because a copyright line should not perform a monologue.

After that came the invisible part: the footer links became real lists inside
real navigation areas. Better for assistive tech, better for structure, better
for the future.

And immediately the browser revealed its ancient opinion:

lists should have dots.

So Discord, Reddit, YouTube, GitHub, and Patreon suddenly looked like groceries.

The fix was not global. We did not ban dots from the whole site. We simply told
the footer community list: you are a list, yes, but you do not need bullets here.

This is web design in miniature. You improve the structure, the browser shows
you the cost, then you negotiate.

### The 264 Pixel Card Problem

The Alien/C.O.P.S. block had a more visual problem.

Cards around 264px wide felt right. Below that, they started to lose dignity.
The images were still there, the text was still there, but the card stopped
feeling like a small object worth inspecting.

The goal became: keep cards near their ideal size when possible, but let the
layout adapt on smaller screens, especially around the iPhone width where 380px
is already a tight little stage.

This is not the same as "make it responsive."

Responsive can mean shrinking until everything technically fits.

Good responsive design knows when an element should stop shrinking and start
rearranging.

That distinction matters for Ludic RPG because the cards are not just links.
They are little doors into projects, props, maps, experiments, and RPG moments.
If the door is too small, nobody wants to open it.

### The Avatar Was Too Random

The avatar had another subtle issue.

It was playing a random clip.

Random sounds alive, but it can also feel weirdly flat. If the same clip appears
too often, randomness stops feeling magical and starts feeling broken.

The better idea was: use all clips.

That changes the mental model. The avatar is no longer a dice roll. It becomes a
small sequence of moods. The visitor does not have to understand the algorithm.
They just get a better feeling: there is more life in this little character than
one repeated trick.

That is very Ludic. More presence, less handling.

### The Homepage Needed Oxygen

The hero, the latest blog/avatar block, and the spotlight area were a little too
close on desktop.

Nothing was broken.

But the page was speaking too fast.

Each block had a different job. The hero sets the promise. The blog/avatar block
brings the human voice. The spotlight points toward the work. If they sit too
tightly together, the visitor does not get enough time to change mental rooms.

So desktop got more space, and tablet got the same final rhythm.

Sometimes design is not adding something.

Sometimes design is letting one thing finish before the next thing starts.

### The Semantic Audit Opened A Trapdoor

Then came the semantic question:

Is every section actually marked up as what it is?

That question looks innocent and then immediately becomes a trapdoor.

A homepage is not only boxes. It is a document. It has a header, navigation,
main content, sections, articles, headings, lists, links, and footer regions.
Search engines read it. Screen readers read it. Browsers read it. Future-you
reads it while wondering who made this mess.

So the page structure was cleaned:

- big blocks became sections with names
- repeated cards became real list items
- latest blog content became article-shaped
- footer groups became named navigation areas
- pages got clearer H1s
- tag pages and blog pages got titles humans can understand

This kind of work is easy to underestimate because the page can look the same
before and after.

But underneath, the site goes from "styled stuff" to "a document with meaning."

### About Broke Because It Got More Correct

The About page is where the session did the funniest developer thing:

we made it more correct, and it broke.

The visible line was:

Hi, I'm Ludo

The user did not want to add anything else there. No extra SEO title. No stiff
heading above it. That line already was the page.

So it became the H1.

Correct.

Except the bubble disappeared.

The reason was simple: the animation script still searched for the old H2. The
HTML had become more semantic, but the JavaScript was still living in the past.
It could not find the heading, so the bubble stayed invisible.

That is a good hidden lesson: semantics and behavior are not separate kingdoms.
If the structure changes, the scripts that depend on that structure must learn
the new shape too.

### Breadcrumbs Were A Bad Idea And We Admitted It

At one point, a breadcrumb/context line appeared in the header.

The idea was sensible: help people know where they are on blog and tag pages.

The result was bad.

Not confusing. Not broken. Just aesthetically wrong.

It made the header feel busy and slightly bureaucratic, like the site suddenly
wanted to explain itself too much.

So it was removed fully from the visible UI.

This matters because design work is not only deciding what to add. It is also
having the taste to remove something when it technically makes sense but feels
wrong.

### The Blog Posts Disappeared Because Obsidian Was In The Room

After the semantic changes, the blog page seemed empty in development.

The posts were not actually gone. The built page still had them. But the dev
server was trying to read Obsidian configuration files inside the blog content
folder as if they were articles.

That is the kind of bug that feels absurd until you remember the site is also a
writing workspace.

The content folder contains blog posts, but it can also contain the tools used to
write those posts. Astro needed a clearer rule:

only files named `post.md` or `post.mdx` are blog posts.

Everything else is workshop dust.

This is one of those hidden systems a reader never sees. They visit `/blog` and
posts appear. Behind that simple result is a content pipeline deciding what is
publication material and what is just the author's working environment.

### The Code Of Conduct Became A Tone Experiment

The Code of Conduct page needed a subtitle.

The first attempt was too plain:

Clear, simple, and fast to read.

True, but dead.

Then came the responsible version:

No ads, clear credit, honest AI use, and respectful support.

Accurate, but a bit like a polite SaaS footer.

Then came quotes. Bill & Ted. Wheaton's Law. The famous blunt version of
Wheaton's Law was funny, but too borderline for a public page. It had the right
nerd energy and the wrong public smell.

The final line found a better balance:

The usually skipped page, made suspiciously short. TL;DR: Wheaton's Law

That works because it says three things at once:

- yes, everyone usually skips this kind of page
- no, this one will not waste your time
- yes, the spirit is simple

It is not just a joke. It is interface trust.

### Tags Were Pretending To Be Buttons

At the end of blog articles, tags looked like buttons.

But they were links.

That difference seems small until you think about what each element promises.

A button says: something will happen here.

A link says: this takes you somewhere related.

The article tags were not controls. They were metadata. So they became simple
underlined links instead of little chip-buttons.

Then the spacing was tightened because they were sitting too far below their
divider. The tags needed to feel attached to the article, not like a separate
component that arrived late.

Again: tiny change, clearer meaning.

### What This Pass Was Really About

This pass was a collection of small corrections, but the pattern underneath was
consistent.

We kept asking:

What is this thing really?

If it is a list, make it a list.

If it is a link, do not dress it as a button.

If it is the page title, make it the H1.

If it is metadata, keep it close and quiet.

If a card should not get smaller, make the layout respect that.

If a joke has the right idea but the wrong public tone, keep looking.

If a feature makes sense and feels bad, remove it.

That is probably the useful article angle:

The new Ludic RPG site was not made better by one dramatic redesign.

It was made better by repeatedly asking small things to tell the truth.

---

## Session Addendum: The Image, The Spotlight, And The Sentence

Then came the pass where the site started arguing about images.

Not hero images. Not marketing images. Article images.

The first problem was embarrassingly practical:

Adding one image to one article was too annoying.

That sounds small, but small friction is where creative workflows quietly lose
energy. Writing in Obsidian should feel like this:

Drag image.
Keep writing.
Publish later.

Instead, one screenshot could become a four-step ritual: place the file, rename
it, check the path, wonder if the final site can still find it, and hope nothing
unused stays in the repo forever.

So the conversation moved from design to authoring. We looked at Obsidian image
plugins and settled around the idea behind Custom Attachment Location: when an
image is pasted or dragged into a post, it should land in the right article
folder automatically.

That led to a tiny Markdown archaeology moment:

```md
![caption or alt text](/path/to/image.png)
```

The brackets are not decorative. They carry text meaning for the image: alt
text, fallback text, sometimes caption-like material depending on how the site
renders it.

This is exactly the kind of thing nontechnical writers only discover when the
workflow gets annoying enough to force the question.

### The Blog Needed A House For Its Images

The old image setup worked, but the mental model was split.

The post lived in one place. The image lived somewhere else. Obsidian had to
know where to drop files. Astro had to know how to publish them. The reader
should never see any of that machinery in the URL.

So we moved toward article folders:

```text
src/content/blog/2025/10_Behind-Ludic-Field/
  post.md
  assets/
    image.png
```

The public URL stays clean:

```text
/blog/building-the-alien-rpg-motion-tracker-immersion-without-friction/
```

That is a useful hidden lesson:

The authoring structure can serve the writer.
The public URL can serve the reader.

They do not have to be the same thing.

Then the blog got a safety net:

```text
npm run blog:check -- <slug>
npm run blog:check -- --all
```

That command is the quiet inspector. It can check required article metadata,
media links, external assets, and unused files in an article folder.

It is not spectacular. It is better than spectacular: it prevents future
annoyance.

Very Ludic, actually.

More presence.
Less handling.

### The Spotlight Images Refused To Sit Still

The homepage then turned Ludic Field and Alien Motion Tracker into two spotlight
cards.

That made sense. They are the two fastest ways to understand Ludic RPG:

- Ludic Field makes maps and plans more visible, shareable, and playable.
- Alien Motion Tracker turns a phone into tension, signal, and table reaction.

The design problem was image framing.

The images were large enough. The code said they were moving. The browser said,
with great confidence, "no."

Then they moved too much.

Then desktop looked good and mobile looked empty.

Then refresh showed the image blinking in one position before settling into
another, which meant some layout rule was quietly correcting the frame after
load.

This was not just an image bug. It was the site teaching us that a responsive
card is not one frame.

It is many frames pretending to be one:

- desktop
- tablet
- large phone
- small phone
- card with text
- card without text
- short buttons
- long buttons

The solution was to give the spotlight component different image framing rules
for mobile, tablet, and desktop.

The reader only sees the final image sitting properly. Behind it, the component
has multiple little instructions depending on how much room it has.

The buttons learned the same trick. On tight layouts:

```text
Open
Devlog
Demo
```

When there is room:

```text
Open the tool
Read the devlog
Watch demo
```

That is a tiny hidden pleasure. The text is not just responsive to screen size.
It responds to the space inside its own card.

### The Phrase Had To Carry Two Meanings

The Alien and C.O.P.S. game headers became a copywriting laboratory.

We tried:

```text
MY TAKE ON ALIEN
MADE FOR ALIEN
FOR ALIEN
IMMERSED IN ALIEN
LUDIC CUT FOR ALIEN
LUDIC PLAY FOR ALIEN
A LUDIC TAKE ON ALIEN
```

The anxiety was real.

"My take on Alien" is clear, but maybe a bit personal. Maybe even a little
pretentious. "Made for" is safer, but flatter. "Ludic Cut" sounds punchy, but
not quite natural in English. "Ludic Play for Alien" risks sounding like Alien
is the audience.

The phrase that survived was:

```text
A Ludic take on ALIEN
```

It has the double reading we wanted:

- Ludic RPG's take on the game
- a playful, ludic angle on the game itself

That matters because Ludic is both the brand and a real adjective. The phrase
does not need to explain the trick. It just carries it.

Then the publisher line disappeared from the visual header. Free League and
Siroz still matter as context, but as typography they were making the block
heavier. The header became simpler. Cleaner. More confident.

### The Site Learned Not To Be Purple

At one point, article links were purple.

Not because purple was chosen. Because browsers choose purple for visited links
unless you tell them otherwise.

It looked default. It broke the dark editorial mood. So links became calmer:

- keep the surrounding text color
- use the underline as the signal
- add a subtle hover highlight
- do not turn visited links purple

Nobody will visit the site and say, "what lovely non-purple visited links."

That is the point.

Good reading design often disappears.

### The Cards Became More Honest

Some homepage cards needed smaller truth corrections.

Draconis 26 was marked as an illustration. But it is a map.

That matters. A map is not just a picture. In Ludic language, a map is a
playable surface. It helps players see, orient, argue, plan, worry, and decide.

C.O.P.S. cards also became tighter:

- "Cards for COPS RPG" became "Custom card sets"
- "News anchor video #1" became "News anchor videos"
- "3D printable model card holder" became "3D print model card holder"
- "Gun magazine shaped holder for COPS ammo cards. Made by AST." became
  "Gun-magazine holder for ammo cards. Made by AST."

Less label noise.
More immediate understanding.

### The Frame Became Positional

The Alien and C.O.P.S. sections also changed visually.

The full frame was too boxed-in, so it became two corners:

- top right
- bottom left

Then those corners became longer. Then gradient. Then the section background
became position-aware.

The first game block fades from transparent top-left toward dark bottom-right.
The last block does the opposite. Any middle block can stay solid dark.

That is a hidden design system choice: the page does not assume there will
always be exactly two game blocks. It adapts to first, last, and middle.

Tiny future-proofing. Quietly theatrical.

### What This Pass Was Really About

This pass looked like image handling, card tweaks, copy edits, and CSS.

Underneath, it was the same question again:

How much friction can we remove before the thing starts to feel effortless?

For the writer, that means images land where they should.

For the reader, that means links, cards, and headings say what they are.

For the site, that means visuals feel alive without becoming noisy.

The new Ludic RPG site is not only a container for the work.

It is slowly becoming an example of the work:

more presence,
less burden,
more fun.
