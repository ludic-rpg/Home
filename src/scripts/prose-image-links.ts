import {
  type ProseImageGroup,
  classifyImageParagraph as classifyProseImageParagraph,
} from './prose-image-groups';

const proseSelector = '.blog-post .prose';
const lightboxOpenClass = 'has-image-lightbox';
const lightboxOpenEvent = 'ludic:image-lightbox-open';
const lightboxCloseEvent = 'ludic:image-lightbox-close';
const minimumEnlargement = 1.25;
const lightboxWidthRatio = 0.92;
const lightboxHeightRatio = 0.9;

const trackedImages = new Set<HTMLImageElement>();
let refreshFrame = 0;

const markImageGroup = (paragraph: HTMLParagraphElement) => {
  const existingGroup = paragraph.dataset.imageGroup as ProseImageGroup | undefined;
  const group = existingGroup || classifyProseImageParagraph(paragraph);
  if (!group) return;

  paragraph.dataset.imageGroup = group;
  if (group !== 'gallery') return;

  paragraph.classList.add('prose-image-gallery');

  if (paragraph.querySelectorAll(':scope > img').length === 6) {
    paragraph.classList.add('prose-image-gallery--six');
  }
};

const sourceForImage = (image: HTMLImageElement) => (
  image.currentSrc || image.getAttribute('src') || ''
);

const isSafeImageSource = (source: string) => {
  try {
    const url = new URL(source, document.baseURI);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isGroupedImage = (image: HTMLImageElement) => Boolean(image.closest(
  '[data-image-group="pair"], [data-image-group="gallery"]',
));

const canMeaningfullyEnlarge = (image: HTMLImageElement) => {
  if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return false;

  const rect = image.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const availableWidth = window.innerWidth * lightboxWidthRatio;
  const availableHeight = window.innerHeight * lightboxHeightRatio;
  const enlargement = Math.min(
    sourceWidth / rect.width,
    sourceHeight / rect.height,
    availableWidth / rect.width,
    availableHeight / rect.height,
  );

  return enlargement >= minimumEnlargement;
};

const imageLink = (image: HTMLImageElement) => {
  const parent = image.parentElement;
  return parent instanceof HTMLAnchorElement && parent.classList.contains('prose-image-link')
    ? parent
    : null;
};

const updateLinkLabel = (link: HTMLAnchorElement, image: HTMLImageElement) => {
  const alt = image.getAttribute('alt')?.trim();
  link.setAttribute('aria-label', alt ? `${alt}. Enlarge image` : 'Enlarge image');
};

const wrapImage = (image: HTMLImageElement) => {
  const existingLink = imageLink(image);
  const source = sourceForImage(image);
  if (!source || !isSafeImageSource(source)) return;

  if (existingLink) {
    existingLink.href = source;
    updateLinkLabel(existingLink, image);
    return;
  }

  if (image.closest('a')) return;

  const link = document.createElement('a');
  link.className = 'prose-image-link';
  link.href = source;
  link.setAttribute('aria-haspopup', 'dialog');
  updateLinkLabel(link, image);

  image.replaceWith(link);
  link.append(image);
};

const unwrapImage = (image: HTMLImageElement) => {
  const link = imageLink(image);
  if (!link) return;

  const shouldKeepFocus = document.activeElement === link;
  if (shouldKeepFocus) image.tabIndex = -1;

  link.replaceWith(image);

  if (shouldKeepFocus) {
    image.focus({ preventScroll: true });
    image.addEventListener('blur', () => image.removeAttribute('tabindex'), { once: true });
  }
};

const refreshImage = (image: HTMLImageElement) => {
  if (!image.isConnected) {
    trackedImages.delete(image);
    return;
  }

  const link = imageLink(image);
  if (!link && image.closest('a')) {
    trackedImages.delete(image);
    return;
  }

  if (isGroupedImage(image) || canMeaningfullyEnlarge(image)) {
    wrapImage(image);
    return;
  }

  unwrapImage(image);
};

const refreshTrackedImages = () => {
  refreshFrame = 0;
  if (document.documentElement.classList.contains(lightboxOpenClass)) return;
  trackedImages.forEach(refreshImage);
};

const queueRefresh = () => {
  if (refreshFrame) return;
  refreshFrame = window.requestAnimationFrame(refreshTrackedImages);
};

const setupImage = (image: HTMLImageElement) => {
  if (image.closest('a') || !image.closest('p[data-image-group]')) return;

  trackedImages.add(image);
  if (!image.complete) {
    image.addEventListener('load', queueRefresh, { once: true });
  }
  refreshImage(image);
};

const requestLightbox = (trigger: HTMLAnchorElement) => {
  const sourceImage = trigger.querySelector<HTMLImageElement>('img');
  const source = sourceImage ? sourceForImage(sourceImage) : '';
  if (!sourceImage || !source) return false;

  const openRequest = new CustomEvent(lightboxOpenEvent, {
    bubbles: false,
    cancelable: true,
    detail: {
      alt: sourceImage.getAttribute('alt')?.trim() ?? '',
      src: source,
      trigger,
    },
  });

  return !document.dispatchEvent(openRequest);
};

const setupProseImages = () => {
  const prose = document.querySelector<HTMLElement>(proseSelector);
  if (!prose) return;

  prose.querySelectorAll<HTMLParagraphElement>('p').forEach(markImageGroup);
  prose.querySelectorAll<HTMLImageElement>('p[data-image-group] img').forEach(setupImage);

  prose.addEventListener('click', (event) => {
    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || !(event.target instanceof Element)
    ) return;

    const trigger = event.target.closest<HTMLAnchorElement>('a.prose-image-link');
    if (!trigger || !prose.contains(trigger)) return;

    if (requestLightbox(trigger)) event.preventDefault();
  });

  window.addEventListener('resize', queueRefresh, { passive: true });
  document.addEventListener(lightboxCloseEvent, queueRefresh);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupProseImages, { once: true });
} else {
  setupProseImages();
}
