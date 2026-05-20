const imagePairSelector = '.prose p';
const reduceMotionQuery = '(prefers-reduced-motion: reduce)';
const mobileQuery = '(max-width: 739.98px)';
const switchDuration = 220;
const switchDeadZone = 32;

type ImagePair = {
  element: HTMLParagraphElement;
  dots: Element[];
  frame: number;
  targetIndex: 0 | 1;
};

const pairs: ImagePair[] = [];

const hasOnlyTwoImages = (paragraph: HTMLParagraphElement) => {
  const elements = Array.from(paragraph.children);
  const images = elements.filter((element): element is HTMLImageElement => element instanceof HTMLImageElement);
  const hasOtherElements = elements.some((element) => !(element instanceof HTMLImageElement));
  const hasText = Array.from(paragraph.childNodes).some((node) => (
    node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''
  ));

  return images.length === 2 && !hasOtherElements && !hasText;
};

const easeInOutCubic = (progress: number) => (
  progress < 0.5
    ? 4 * progress ** 3
    : 1 - ((-2 * progress + 2) ** 3) / 2
);

const activeHeaderHeight = () => {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header) return 0;

  const rect = header.getBoundingClientRect();
  return Math.max(0, rect.bottom);
};

const switchLine = () => {
  const topInset = activeHeaderHeight();
  return topInset + (window.innerHeight - topInset) / 2;
};

const updateIndicator = (pair: ImagePair) => {
  const maximumScroll = pair.element.scrollWidth - pair.element.clientWidth;
  const activeIndex = pair.element.scrollLeft > maximumScroll / 2 ? 1 : 0;

  pair.dots.forEach((dot, index) => {
    dot.classList.toggle('is-active', index === activeIndex);
  });
};

const animateToSlide = (pair: ImagePair, targetIndex: 0 | 1, reduceMotion: boolean) => {
  const maximumScroll = pair.element.scrollWidth - pair.element.clientWidth;
  if (maximumScroll <= 8) return;

  const targetScroll = targetIndex === 0 ? 0 : maximumScroll;
  const startScroll = pair.element.scrollLeft;
  const distance = targetScroll - startScroll;

  if (Math.abs(distance) < 1 || reduceMotion) {
    pair.element.scrollLeft = targetScroll;
    updateIndicator(pair);
    return;
  }

  if (pair.frame) {
    window.cancelAnimationFrame(pair.frame);
  }

  const startedAt = performance.now();
  pair.element.classList.add('is-switching');

  const animate = (now: number) => {
    const elapsed = Math.min(switchDuration, now - startedAt);
    const progress = easeInOutCubic(elapsed / switchDuration);

    pair.element.scrollLeft = startScroll + distance * progress;
    updateIndicator(pair);

    if (elapsed < switchDuration) {
      pair.frame = window.requestAnimationFrame(animate);
      return;
    }

    pair.element.scrollLeft = targetScroll;
    pair.element.classList.remove('is-switching');
    pair.frame = 0;
    updateIndicator(pair);
  };

  pair.frame = window.requestAnimationFrame(animate);
};

const resetForDesktop = (pair: ImagePair) => {
  if (pair.frame) {
    window.cancelAnimationFrame(pair.frame);
    pair.frame = 0;
  }

  pair.targetIndex = 0;
  pair.element.classList.remove('is-switching');
  pair.element.scrollLeft = 0;
  updateIndicator(pair);
};

const desiredSlide = (element: HTMLElement, currentIndex: 0 | 1, line: number): 0 | 1 => {
  const rect = element.getBoundingClientRect();
  const elementCenter = rect.top + rect.height / 2;

  if (currentIndex === 0 && elementCenter < line - switchDeadZone) {
    return 1;
  }

  if (currentIndex === 1 && elementCenter > line + switchDeadZone) {
    return 0;
  }

  return currentIndex;
};

const updatePairsFromScroll = () => {
  const isMobile = window.matchMedia(mobileQuery).matches;
  const reduceMotion = window.matchMedia(reduceMotionQuery).matches;
  const line = isMobile ? switchLine() : 0;

  pairs.forEach((pair) => {
    if (!isMobile) {
      resetForDesktop(pair);
      return;
    }

    const nextIndex = desiredSlide(pair.element, pair.targetIndex, line);
    if (nextIndex === pair.targetIndex) {
      const expectedScroll = pair.targetIndex === 0 ? 0 : pair.element.scrollWidth - pair.element.clientWidth;
      if (!pair.frame && Math.abs(pair.element.scrollLeft - expectedScroll) > 1) {
        pair.element.scrollLeft = expectedScroll;
      }
      updateIndicator(pair);
      return;
    }

    pair.targetIndex = nextIndex;
    animateToSlide(pair, nextIndex, reduceMotion);
  });
};

const setupPair = (pair: HTMLParagraphElement) => {
  if (pair.dataset.imagePairReady === 'true') return;
  if (!hasOnlyTwoImages(pair)) return;

  const images = Array.from(pair.children).filter((element): element is HTMLImageElement => (
    element instanceof HTMLImageElement
  ));

  pair.dataset.imagePairReady = 'true';
  pair.classList.add('prose-image-pair');

  images.forEach((image) => {
    const slide = document.createElement('span');
    slide.className = 'prose-image-pair__slide';

    image.replaceWith(slide);
    slide.append(image);
  });

  const indicator = document.createElement('span');
  indicator.className = 'prose-image-pair__indicator';
  indicator.setAttribute('aria-hidden', 'true');

  images.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = 'prose-image-pair__dot';
    if (index === 0) {
      dot.classList.add('is-active');
    }
    indicator.append(dot);
  });

  pair.insertAdjacentElement('afterend', indicator);

  const syncPairAspectRatio = () => {
    const ratios = images
      .map((image) => image.naturalWidth / image.naturalHeight)
      .filter((ratio) => Number.isFinite(ratio) && ratio > 0);

    if (ratios.length !== images.length) return;

    const averageRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
    pair.style.setProperty('--image-pair-aspect-ratio', averageRatio.toFixed(4));
  };

  images.forEach((image) => {
    if (image.complete) return;
    image.addEventListener('load', syncPairAspectRatio, { once: true });
  });

  syncPairAspectRatio();

  pairs.push({
    element: pair,
    dots: Array.from(indicator.children),
    frame: 0,
    targetIndex: 0,
  });
};

const setupProseImagePairs = () => {
  let updateFrame = 0;

  const queueUpdate = () => {
    if (updateFrame) return;
    updateFrame = window.requestAnimationFrame(() => {
      updateFrame = 0;
      updatePairsFromScroll();
    });
  };

  document.querySelectorAll<HTMLParagraphElement>(imagePairSelector).forEach(setupPair);

  window.addEventListener('scroll', queueUpdate, { passive: true });
  window.addEventListener('resize', queueUpdate, { passive: true });
  queueUpdate();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupProseImagePairs, { once: true });
} else {
  setupProseImagePairs();
}
