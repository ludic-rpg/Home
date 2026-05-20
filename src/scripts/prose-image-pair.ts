const imagePairSelector = '.prose p';
const reduceMotionQuery = '(prefers-reduced-motion: reduce)';
const centerTriggerRange = 0.18;
const autoPeekKeyframes = [
  { time: 0, value: 0 },
  { time: 260, value: 1.12 },
  { time: 340, value: 0.88 },
  { time: 420, value: 1.06 },
  { time: 490, value: 0.97 },
  { time: 560, value: 1 },
];

const hasOnlyTwoImages = (paragraph: HTMLParagraphElement) => {
  const elements = Array.from(paragraph.children);
  const images = elements.filter((element): element is HTMLImageElement => element instanceof HTMLImageElement);
  const hasOtherElements = elements.some((element) => !(element instanceof HTMLImageElement));
  const hasText = Array.from(paragraph.childNodes).some((node) => (
    node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''
  ));

  return images.length === 2 && !hasOtherElements && !hasText;
};

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;
const easeInCubic = (progress: number) => progress ** 3;

const easedProgress = (progress: number, fromValue: number, toValue: number, segmentStart: number) => {
  if (segmentStart === 0 && fromValue < toValue) {
    return easeInCubic(progress);
  }

  if (fromValue < toValue) {
    return easeOutCubic(progress);
  }

  return easeInCubic(progress);
};

const setupPair = (
  pair: HTMLParagraphElement,
  observer: IntersectionObserver | null,
) => {
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

  const maxScroll = () => pair.scrollWidth - pair.clientWidth;
  const canScroll = () => maxScroll() > 8;
  const dots = Array.from(indicator.children);

  let hasUserInteracted = false;
  let hasPeeked = false;
  let isAutoPeeking = false;
  let autoPeekFrame = 0;

  const stopAutoPeek = (keepPeekState = false) => {
    if (autoPeekFrame) {
      window.cancelAnimationFrame(autoPeekFrame);
      autoPeekFrame = 0;
    }
    isAutoPeeking = false;
    if (!keepPeekState) {
      pair.classList.remove('is-peeking');
    }
  };

  const markUserInteraction = () => {
    hasUserInteracted = true;
    stopAutoPeek();
  };

  const updateIndicator = () => {
    const activeIndex = pair.scrollLeft > maxScroll() / 2 ? 1 : 0;
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === activeIndex);
    });
  };

  const nearestStableScroll = () => {
    const maximumScroll = maxScroll();
    return pair.scrollLeft > maximumScroll / 2 ? maximumScroll : 0;
  };

  const resetWhenOutOfView = () => {
    stopAutoPeek();
    if (canScroll()) {
      pair.scrollLeft = nearestStableScroll();
    }
    hasUserInteracted = false;
    hasPeeked = false;
    updateIndicator();
  };

  const syncPairAspectRatio = () => {
    const ratios = images
      .map((image) => image.naturalWidth / image.naturalHeight)
      .filter((ratio) => Number.isFinite(ratio) && ratio > 0);

    if (ratios.length !== images.length) return;

    const averageRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
    pair.style.setProperty('--image-pair-aspect-ratio', averageRatio.toFixed(4));
  };

  const peekNextImage = () => {
    if (hasPeeked || hasUserInteracted || isAutoPeeking || !canScroll()) return;
    isAutoPeeking = true;
    pair.classList.add('is-peeking');

    const maximumScroll = maxScroll();
    const startScroll = nearestStableScroll();
    const direction = startScroll === 0 ? 1 : -1;
    const peekDistance = Math.min(140, pair.clientWidth * 0.34, maximumScroll);
    const startedAt = performance.now();
    const duration = autoPeekKeyframes[autoPeekKeyframes.length - 1].time;

    pair.scrollLeft = startScroll;

    const animate = (now: number) => {
      if (hasUserInteracted) {
        stopAutoPeek();
        hasPeeked = true;
        return;
      }

      const elapsed = Math.min(duration, now - startedAt);
      const nextFrameIndex = autoPeekKeyframes.findIndex((keyframe) => keyframe.time >= elapsed);
      const toIndex = nextFrameIndex === -1 ? autoPeekKeyframes.length - 1 : nextFrameIndex;
      const from = autoPeekKeyframes[Math.max(0, toIndex - 1)];
      const to = autoPeekKeyframes[toIndex];
      const segmentDuration = Math.max(1, to.time - from.time);
      const segmentProgress = (elapsed - from.time) / segmentDuration;
      const progress = easedProgress(segmentProgress, from.value, to.value, from.time);
      const value = from.value + (to.value - from.value) * progress;

      pair.scrollLeft = Math.min(maximumScroll, Math.max(0, startScroll + direction * peekDistance * value));
      updateIndicator();

      if (elapsed < duration) {
        autoPeekFrame = window.requestAnimationFrame(animate);
        return;
      }

      pair.scrollLeft = Math.min(
        maximumScroll,
        Math.max(0, startScroll + direction * peekDistance * autoPeekKeyframes[autoPeekKeyframes.length - 1].value),
      );
      updateIndicator();
      stopAutoPeek(true);
      hasPeeked = true;
    };

    autoPeekFrame = window.requestAnimationFrame(animate);
  };

  pair.addEventListener('pointerdown', markUserInteraction);
  pair.addEventListener('touchstart', markUserInteraction, { passive: true });
  pair.addEventListener('wheel', markUserInteraction, { passive: true });
  pair.addEventListener('keydown', markUserInteraction);
  pair.addEventListener('scroll', () => {
    updateIndicator();
  }, { passive: true });
  pair.addEventListener('prose-image-pair:peek', peekNextImage);
  pair.addEventListener('prose-image-pair:reset', resetWhenOutOfView);

  images.forEach((image) => {
    if (image.complete) return;
    image.addEventListener('load', syncPairAspectRatio, { once: true });
  });

  syncPairAspectRatio();

  if (observer) {
    observer.observe(pair);
  }
};

const setupProseImagePairs = () => {
  const prefersReducedMotion = window.matchMedia(reduceMotionQuery).matches;
  const visiblePairs = new Set<HTMLParagraphElement>();
  let checkFrame = 0;

  const isNearViewportCenter = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const allowedDistance = window.innerHeight * centerTriggerRange;

    return Math.abs(elementCenter - viewportCenter) <= allowedDistance;
  };

  const triggerPeek = (pair: HTMLParagraphElement) => {
    const event = new CustomEvent('prose-image-pair:peek');
    pair.dispatchEvent(event);
    visiblePairs.delete(pair);
  };

  const checkVisiblePairs = () => {
    checkFrame = 0;
    visiblePairs.forEach((pair) => {
      if (isNearViewportCenter(pair)) {
        triggerPeek(pair);
      }
    });
  };

  const queueCenterCheck = () => {
    if (checkFrame) return;
    checkFrame = window.requestAnimationFrame(checkVisiblePairs);
  };

  const observer = prefersReducedMotion || !('IntersectionObserver' in window)
    ? null
    : new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        const pair = entry.target as HTMLParagraphElement;
        if (entry.isIntersecting) {
          visiblePairs.add(pair);
        } else {
          visiblePairs.delete(pair);
          pair.dispatchEvent(new CustomEvent('prose-image-pair:reset'));
        }
      });

      queueCenterCheck();
    }, {
      threshold: 0.01,
    });

  if (observer) {
    window.addEventListener('scroll', () => queueCenterCheck(observer), { passive: true });
    window.addEventListener('resize', () => queueCenterCheck(observer), { passive: true });
  }

  document.querySelectorAll<HTMLParagraphElement>(imagePairSelector).forEach((paragraph) => {
    setupPair(paragraph, observer);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupProseImagePairs, { once: true });
} else {
  setupProseImagePairs();
}
