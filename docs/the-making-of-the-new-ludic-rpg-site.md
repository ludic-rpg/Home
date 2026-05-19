# The Making of the New Ludic RPG Site

This is a story-oriented working draft for an article, not a technical review.
It is meant to preserve the messy, funny, useful path of the redesign session:
what we wanted, where we struggled, what we dropped, what we learned, and what
quiet little mechanisms now exist behind the site.

## The Short Version

We did not redesign the Ludic RPG site by starting with a grand visual concept.
We started with a very small irritation:

Adding one image to one article was too annoying.

That tiny annoyance opened the whole machine.

First came Obsidian image handling. Then article integrity checks. Then the blog
folder structure. Then homepage cards. Then mobile spacing. Then spotlight
images that refused to sit where we wanted. Then titles, captions, gradients,
corner borders, link colors, avatar borders, and the strange emotional question
of whether "My take on Alien" sounded too pretentious.

The redesign became less about decoration and more about friction.

Could publishing be smoother?
Could articles carry their images without turning into asset archaeology?
Could the homepage say "this is Ludic RPG" without sounding like a product deck?
Could the cards feel alive, but still readable?
Could the site show tools, props, maps, apps, and campaign material as one idea:
immersive play experiences?

That was the real work.

## The First Problem Was Not Visual

The first fight was not with colors, fonts, or layout.
It was with images.

Writing articles in Obsidian was supposed to feel simple. Drag an image into a
note, write the article, publish it. Instead, the workflow had too many small
steps. One image meant thinking about where it lived, how it was named, how the
Markdown path should look, whether the published site could find it, and whether
unused leftovers were gathering in the repo.

For a blog about making RPG experiences smoother, that was a bit embarrassing.

So we looked at Obsidian plugins and settled around Custom Attachment Location:
a plugin that can copy pasted or dragged images into the right folder. This was
not glamorous, but it mattered. A lot of creative energy leaks through tiny file
management cuts.

Then came the first hidden lesson:

Markdown image syntax has two parts.

```md
![caption or alt text](/path/to/image.png)
```

The brackets are not decoration. They carry the text description. They can be
used for accessibility, fallbacks, and sometimes captions depending on the
renderer. That sent us briefly into caption plugins too, before we narrowed the
real problem: the goal was not prettier Markdown syntax. The goal was easier
editorial UX.

## The Blog Needed A Real House For Images

The old setup put article media under a shared public asset tree. It worked, but
it created a mental split:

- the article lived in one place
- the images lived somewhere else
- the URL needed to stay clean
- Obsidian needed to know where to place attachments
- the checker needed to know what belonged to what

We imagined a cleaner structure:

```text
src/content/blog/2025/10_Behind-Ludic-Field/
  post.md
  assets/
    image.png
```

The article and its media would live together. Like a small package. Like a
session folder. Open it and you know what belongs to it.

But we did not want the URL to become ugly. The public article URL should still
look like:

```text
/blog/building-the-alien-rpg-motion-tracker-immersion-without-friction/
```

So we separated the authoring structure from the public URL. The folder can
serve the writer. The slug can serve the reader. That distinction is invisible
on the site, but it is one of the most important improvements.

We also created a blog check command:

```text
npm run blog:check -- <slug>
npm run blog:check -- --all
```

That check became the quiet editorial inspector. It verifies required
frontmatter, article integrity, images referenced in the post, external media,
and unused assets sitting in the article folder. It is part code, part editorial
habit. Not very flashy, but exactly the kind of tool that protects trust.

The funniest part is that this is the same Ludic principle again:

More richness, less handling.

Even the blog tooling should follow the brand.

## The Homepage Started As A Shelf, Then Became A Stage

The homepage needed to show several things without feeling like a warehouse:

- Ludic Field
- Alien Motion Tracker
- Alien RPG campaign material
- C.O.P.S. campaign prep
- props, cards, videos, maps, apps, tools

At first, these were just project cards. Useful, but not enough. Ludic RPG is
not a collection of random outputs. It is a way of making play more tangible.

So the homepage needed hierarchy.

We promoted Ludic Field and Alien Motion Tracker into spotlight cards. They are
the two things that best explain the site immediately: one is about seeing and
handling space, the other is about tension, signal, and player reaction.

That caused a very visual struggle:

The images looked good, but the points of interest were never where we wanted
them.

The Alien Motion Tracker image was large enough, but moving it seemed to do
nothing. Then it moved too much. Then it looked fine on desktop and empty on
mobile. Then refreshing the page made it blink into one position and settle into
another, which was our clue that some layout rule was quietly correcting it.

This was one of the most useful design fights of the session.

We were not just placing an image. We were discovering that a responsive card is
not one frame. It is several frames:

- desktop
- tablet
- large phone
- small phone
- card with text
- card without text
- card with buttons side by side
- card with long button labels
- card with short button labels

The solution was not "move image right by 20 percent." The solution was to give
the spotlight component separate framing controls for mobile, tablet, and
desktop. That is a small invisible system. The reader only sees the image sitting
properly. Behind it, the card has different instructions depending on the space.

## We Dropped Some Ideas Because They Were Too Clever

There were a lot of title experiments.

For the game blocks, we wanted a header that said:

```text
MY TAKE ON ALIEN
```

Then:

```text
MADE FOR ALIEN
FOR ALIEN
IMMERSED IN ALIEN
LUDIC CUT FOR ALIEN
LUDIC PLAY FOR ALIEN
A LUDIC TAKE ON ALIEN
```

This was not just copy fiddling. It was positioning.

"My take on Alien" is clear in English, but it can sound slightly personal or
even pretentious. It might imply authority over the official game. "Made for"
was safer, but flatter. "Ludic Cut" sounded fun, but not fully natural in
English. "Ludic Play for Alien" could be misunderstood as Ludic performing for
Alien, or Alien being an audience, which is not what we wanted.

The winning phrase became:

```text
A Ludic take on ALIEN
```

It has two readings:

- this is Ludic RPG's take on the game
- it is a playful, ludic angle on the game itself

That double reading matters. Ludic is the brand, but "ludic" is also an
adjective. The phrase carries both without explaining itself.

Then we removed the publishers from the visual header. Free League and Siroz are
still contextually important, but as typography they made the block look heavier
and less elegant. The header became simpler:

```text
A Ludic take on ALIEN
A Ludic take on C.O.P.S.
```

Less information. Stronger signal.

## The Site Learned To Be Less Purple

One small reader-experience problem appeared in article links: visited links
were purple.

Purple is fine in many places. Here it felt wrong. Too default. Too browser
ancient. Too unrelated to the calm dark reading experience we were building.

So we made global link styling more editorial:

- text keeps the surrounding color
- underline carries the signal
- hover adds a quiet highlight
- visited links do not turn purple

This is the kind of detail most readers will never name. But they feel it. A
site can lose its voice through default colors.

## The Cards Became More Honest

The Alien and C.O.P.S. cards also went through small naming corrections.

Draconis 26 was marked as an illustration. But it is a map. That distinction
matters because the homepage is not only decorative. It teaches visitors what
Ludic RPG makes.

C.O.P.S. card titles also got trimmed:

- "Cards for COPS RPG" became "Custom card sets"
- "News anchor video #1" became "News anchor videos"
- "3D printable model card holder" became "3D print model card holder"
- "Gun magazine shaped holder for COPS ammo cards. Made by AST." became
  "Gun-magazine holder for ammo cards. Made by AST."

These are tiny edits, but they point in the same direction: less label noise,
more immediate understanding.

## The Visual Language Became A Little More Ludic

The game sections originally had full frames. That felt too boxed-in. Then we
replaced the full frame with only two corners:

- top right
- bottom left

Those corners became longer, then gradient. They suggest a technical schematic
or tactical interface without drawing a complete container around the content.

The background also became position-aware.

The first game block has a subtle dark gradient toward the bottom right. The
last has the opposite treatment. If there are middle game blocks later, they can
stay solid dark. This is a hidden layout idea: the design adapts to the number
of blocks instead of assuming there will always be exactly two.

The spotlight title separator also changed from a flat line to a gradient:
white on the left, transparent on the right. Again, this is not a headline
feature. It is atmosphere. The line starts like a signal and fades like a scan.

## Mobile Kept Interrupting, Correctly

Mobile was not a final pass. It kept interrupting the work.

The main container had too much side padding on small screens. The spotlight
buttons needed to sit side by side on mobile. Button labels needed to shorten
when space was tight:

```text
Open
Devlog
Demo
```

But when space allowed, they should grow back:

```text
Open the tool
Read the devlog
Watch demo
```

That sounds simple until you realize it is not only about screen width. It is
about button width inside a card. So the component now uses the available space
of the button area itself to decide whether to show the short or long label.

That is a nice hidden detail for readers:

The text is not just responsive to the phone. It is responsive to the room it
has inside the interface.

## The Avatar Lost Its Border

The homepage avatar had a border.

At some point, it started to feel like too much. A circular frame around a
little living avatar made it feel more like an icon and less like a tiny
presence.

So the homepage avatar lost the border.

The About page can still keep its own treatment, because context matters. On the
homepage, the avatar sits next to the "Last Post" bubble. It needs to feel
natural, not framed like a badge.

We also tuned avatar animations. The goal was not "more animation." The goal was
timing: the little reveal should feel intentional, not like elements accidentally
arrived late.

## The Hidden Machinery

Here are the quiet systems now behind the site, written for a nontechnical
reader:

- Obsidian can drop images into the right article folder instead of forcing
  manual file sorting.
- Blog posts now live beside their images, while the public URLs stay clean.
- A blog check command can inspect an article before publication.
- The checker can notice missing media and unused article assets.
- Spotlight cards can frame images differently on mobile, tablet, and desktop.
- Spotlight buttons can choose short or long labels depending on available
  space.
- Global links no longer fall back to default purple visited styling.
- Game section backgrounds adapt to their position in the page.
- The homepage avatar and About avatar can have different visual behavior.
- Every built HTML page now has a proper `<main>` landmark.

That last one is especially invisible. Nobody visits a site and says, "Nice
main tag." But screen readers, search engines, and document structure all care.
Good semantic HTML is like good table prep: when it works, nobody has to think
about it.

## What We Actually Did

By the end, the session had touched three layers of the site.

The writer layer:

- easier Obsidian image handling
- cleaner article folder structure
- article/media integrity checks
- fewer unused assets

The reader layer:

- better global link styling
- more coherent homepage hierarchy
- clearer card titles and descriptions
- `<main>` checked across all rendered pages

The atmosphere layer:

- new spotlight cards
- better project images
- responsive image framing
- gradient separators
- corner-only frames
- subtler dark backgrounds
- simplified game headers
- avatar border removed

The funny part is that all three layers are the same job in disguise.

Make the site smoother to write.
Make the site clearer to read.
Make the site feel more like Ludic RPG.

## Possible Article Angle

The article could open with something like:

> I redesigned the Ludic RPG site because adding one image to one article was
> annoying.

That is the honest hook.

From there, the article can reveal that the new site was not born from a mood
board. It came from practical friction. Every visible detail has a hidden
workflow problem behind it:

- images needed a home
- articles needed checks
- cards needed better framing
- mobile needed respect
- links needed editorial calm
- project labels needed honesty
- the homepage needed to explain Ludic RPG without overexplaining it

The ending can return to the Ludic promise:

The site is not just a portfolio. It is becoming a playable surface for the
work. A place where maps, apps, props, videos, articles, and campaign material
all point to the same idea:

```text
Richer for players.
Smoother for game masters.
More fun for everyone.
```

And, apparently:

```text
Less pain when adding one screenshot.
```

