# Blog Image Groups and Lightbox Specification

Status: implemented

## Purpose

Article images should use the space available to them without making every image interactive. The lightbox exists to give selected images more screen space. It is not a raw-image viewer, download tool, or zoom inspector.

The implementation must keep article Markdown simple and compatible with Obsidian.

## Image group semantics

Grouping is determined inside a single image-only Markdown paragraph. Images must never be grouped merely because their paragraphs happen to be adjacent in the rendered article.

- One image in an image-only paragraph is a solo image.
- Exactly two images in the same image-only paragraph form an image pair.
- Three or more images in the same image-only paragraph form a gallery.
- Exactly six images use the six-item gallery presentation: three columns by two rows on desktop and two columns on mobile.
- A blank line ends the current group.

For example, this is one pair:

```markdown
![First image](first.png) ![Second image](second.png)
```

This is one gallery because the images remain in the same Markdown paragraph:

```markdown
![First image](first.png)
![Second image](second.png)
![Third image](third.png)
```

This is two successive pairs, not one four-image gallery, because the blank line creates two paragraphs:

```markdown
![First image](first.png) ![Second image](second.png)

![Third image](third.png) ![Fourth image](fourth.png)
```

## Pair and gallery presentation

An image pair is a two-column comparison on desktop and may use the existing paired carousel behavior on mobile.

A gallery is a grid on desktop and mobile. It must not inherit the pair carousel behavior. Gallery items may open independently in the lightbox.

The distinction is implemented by one shared classifier and consumed by the
presentation scripts:

- `src/scripts/prose-image-groups.ts` derives `solo`, `pair`, or `gallery` from
  each image-only paragraph.
- `src/scripts/prose-image-pair.ts` applies the pair behavior.
- `src/scripts/prose-image-links.ts` applies gallery classes and lightbox
  eligibility.
- `src/styles/reader-prose.css` owns pair and gallery presentation.
- `src/components/blog/ImageLightbox.astro` owns the reusable lightbox and its
  presentation.

This is currently reusable site behavior, but it is not a standalone Astro gallery component.

## Reusable architecture

Keep pure Markdown as the authoring format. Do not require every article to import an Astro or MDX component.

One shared image-group classifier derives `solo`, `pair`, or `gallery` entirely
from the structure of each image-only Markdown paragraph. Pair behavior,
gallery styling, and lightbox eligibility consume that result instead of
independently inferring intent.

Do not add group markers, HTML comments, MDX components, or per-article classes. Paragraph boundaries and image count are the authoring interface. Mere adjacency across paragraph boundaries must never merge groups.

One reusable lightbox instance is mounted by `BlogPostLayout.astro`. It serves
every eligible image on the page without creating one dialog per image.

## Lightbox eligibility

Apply the rules in this order:

1. Images inside a pair or gallery enable it because their normal presentation deliberately reduces their available space.
2. A solo image enables it only when the lightbox can display it meaningfully larger.

For a solo image, compare its current rendered rectangle with the largest rectangle that preserves its aspect ratio inside approximately `92vw` by `90dvh`. Respect the image's intrinsic resolution so that the lightbox does not offer enlargement that would only produce obvious blur.

Enable the solo lightbox only when the fitted result is at least 25 percent larger in width or height than the inline presentation. Recalculate after the image loads and when the viewport changes.

This rule should naturally produce the desired device behavior:

- A solo image in a narrow desktop article column may qualify.
- The same image at nearly full viewport width on mobile usually will not qualify.
- A gallery tile qualifies on both desktop and mobile.

Only eligible images should show a pointer cursor, focus treatment, or enlargement affordance.

## Lightbox media source

Use the same optimized production image already displayed in the article. Opening the lightbox should normally reuse the browser cache and add no image transfer.

Do not load the raw PNG, create a special high-resolution source, or add a responsive-image pipeline solely for the lightbox. The current production WebP files retain enough dimensions for this screen-space purpose.

## Interaction and accessibility

- Use a native modal dialog when supported.
- Close with Escape, the close button, or a click on the backdrop.
- Restore focus to the triggering image after closing.
- Lock background scrolling while open.
- Preserve useful alternative text on the displayed image and dialog label.
- Respect reduced-motion preferences.
- Keep the presentation visually subtle: no decorative frame, border, or heavy chrome.
- Do not activate article covers, logos, icons, or images that already link somewhere else.

## Non-goals

- Raw-source inspection
- Pixel-level zooming or panning
- Image downloads
- Making every article image clickable
- Changing the current asset-compression pipeline
- Converting blog Markdown to MDX solely for galleries

## Verification cases

Test at minimum:

- One solo image on desktop with meaningful enlargement
- One solo image on mobile with no meaningful enlargement
- One low-resolution solo image
- One two-image pair on desktop and mobile
- Two successive two-image pairs separated by a blank line
- One three-image gallery
- One six-image gallery
- An image already contained by an external link
- Keyboard opening, Escape closing, backdrop closing, and focus restoration
- Resize and orientation changes while the article is open
- Reduced-motion and save-data environments
