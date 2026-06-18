const AVATAR_MEDIA_SELECTOR = '[data-avatar-media]';
const AVATAR_INTERSECTION_MARGIN = '400px 0px';

let avatarObserver: IntersectionObserver | null = null;

const shouldSkipAvatarVideo = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = 'connection' in navigator
    ? navigator.connection as {
      effectiveType?: string;
      saveData?: boolean;
    }
    : undefined;
  return (
    prefersReducedMotion ||
    connection?.saveData ||
    ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '')
  );
};

const setupAvatar = (avatar: HTMLElement) => {
  if (avatar.dataset.avatarReady === 'true') return;
  avatar.dataset.avatarReady = 'true';

  const randomVideo = avatar.querySelector<HTMLVideoElement>('[data-avatar-random-video]');
  const hoverVideo = avatar.querySelector<HTMLVideoElement>('[data-avatar-hover-video]');
  if (shouldSkipAvatarVideo()) return;

  const maxLoadedClipCount = window.matchMedia('(max-width: 768px)').matches ? 3 : Number.POSITIVE_INFINITY;

  let isLoadingRandomVideo = false;
  const loadedClipSrcs = new Set<string>();

  const canLoadClip = (video: HTMLVideoElement, videoSrc: string) => (
    video.getAttribute('src') === videoSrc ||
    loadedClipSrcs.has(videoSrc) ||
    loadedClipSrcs.size < maxLoadedClipCount
  );

  const loadClip = (video: HTMLVideoElement, videoSrc: string) => {
    if (video.getAttribute('src') === videoSrc) return true;
    if (!loadedClipSrcs.has(videoSrc) && loadedClipSrcs.size >= maxLoadedClipCount) return false;

    video.src = videoSrc;
    loadedClipSrcs.add(videoSrc);
    return true;
  };

  const isVideoVisible = () => (
    avatar.classList.contains('is-video-ready') ||
    avatar.classList.contains('is-hover-video-ready')
  );

  const isBusy = () => isLoadingRandomVideo || isVideoVisible();

  const hideRandomVideo = () => {
    avatar.classList.remove('is-video-ready');
    isLoadingRandomVideo = false;
    if (!randomVideo) return;
    randomVideo.pause();
    randomVideo.currentTime = 0;
  };

  const hideHoverVideo = () => {
    avatar.classList.remove('is-hover-video-ready');
    if (!hoverVideo) return;
    hoverVideo.pause();
    hoverVideo.currentTime = 0;
  };

  const playHoverVideo = () => {
    if (!hoverVideo?.src) return;
    if (isBusy()) return;

    hoverVideo.currentTime = 0;
    hoverVideo.play().catch(hideHoverVideo);
  };

  const hoverVideoSrc = avatar.dataset.avatarHoverSrc;
  if (hoverVideo && hoverVideoSrc) {
    hoverVideo.addEventListener('playing', () => {
      avatar.classList.add('is-hover-video-ready');
    });
    hoverVideo.addEventListener('ended', hideHoverVideo);

    if (loadClip(hoverVideo, hoverVideoSrc)) {
      hoverVideo.preload = 'auto';
      hoverVideo.load();
    }

    avatar.addEventListener('mouseenter', playHoverVideo);
    avatar.addEventListener('focusin', playHoverVideo);
  }

  if (!randomVideo) return;

  const chance = Number.parseFloat(avatar.dataset.avatarChance ?? '0.2');
  const rollChance = Number.isFinite(chance) ? chance : 0.2;
  const chanceStep = Number.parseFloat(avatar.dataset.avatarChanceStep ?? '0.2');
  const rollChanceStep = Number.isFinite(chanceStep) ? chanceStep : 0.2;
  let currentRollChance = rollChance;

  const videoSrcs = [...new Set((avatar.dataset.avatarVideoSrcs ?? '').split(/\s+/).filter(Boolean))];
  if (videoSrcs.length === 0) return;
  let lastAmbientVideoSrc = '';

  randomVideo.addEventListener('playing', () => {
    isLoadingRandomVideo = false;
    avatar.classList.add('is-video-ready');
  });

  randomVideo.addEventListener('ended', hideRandomVideo);
  randomVideo.addEventListener('error', hideRandomVideo);

  const getRandomVideoSrc = () => {
    const candidates = videoSrcs.filter((videoSrc) => canLoadClip(randomVideo, videoSrc));
    if (candidates.length === 0) return '';

    const freshCandidates = candidates.filter((videoSrc) => videoSrc !== lastAmbientVideoSrc);
    const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const selectVideoSrc = (preferredVideoSrc = '') => {
    if (!preferredVideoSrc) return getRandomVideoSrc();
    return preferredVideoSrc;
  };

  const playAmbientVideo = (force = false, preferredVideoSrc = '') => {
    if (isBusy() || avatar.matches(':hover')) return;
    if (!force && Math.random() > currentRollChance) {
      currentRollChance = Math.min(1, currentRollChance + rollChanceStep);
      return;
    }

    const videoSrc = selectVideoSrc(preferredVideoSrc);
    if (!videoSrc) return;
    if (!canLoadClip(randomVideo, videoSrc)) return;

    currentRollChance = rollChance;
    isLoadingRandomVideo = true;
    lastAmbientVideoSrc = videoSrc;

    const playWhenReady = () => {
      isLoadingRandomVideo = false;
      if (isVideoVisible() || avatar.matches(':hover')) return;
      randomVideo.currentTime = 0;
      randomVideo.play().catch(hideRandomVideo);
    };

    if (randomVideo.getAttribute('src') !== videoSrc) {
      if (!loadClip(randomVideo, videoSrc)) {
        isLoadingRandomVideo = false;
        return;
      }
      randomVideo.addEventListener('canplay', playWhenReady, { once: true });
      randomVideo.load();
      return;
    }

    playWhenReady();
  };

  playAmbientVideo(true, avatar.dataset.avatarFirstSrc);
  window.setInterval(() => playAmbientVideo(false), 5000);
};

const getAvatarObserver = () => {
  if (avatarObserver) return avatarObserver;

  avatarObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const avatar = entry.target as HTMLElement;
      avatarObserver?.unobserve(avatar);
      setupAvatar(avatar);
    });
  }, {
    rootMargin: AVATAR_INTERSECTION_MARGIN,
  });

  return avatarObserver;
};

const observeAvatar = (avatar: HTMLElement) => {
  if (avatar.dataset.avatarReady === 'true' || avatar.dataset.avatarObserved === 'true') return;

  if (
    avatar.dataset.avatarPlayImmediately === 'true' ||
    shouldSkipAvatarVideo() ||
    !('IntersectionObserver' in window)
  ) {
    setupAvatar(avatar);
    return;
  }

  avatar.dataset.avatarObserved = 'true';
  getAvatarObserver().observe(avatar);
};

const setupAvatarMedia = (selector = AVATAR_MEDIA_SELECTOR) => {
  document.querySelectorAll<HTMLElement>(selector).forEach(observeAvatar);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setupAvatarMedia(), { once: true });
} else {
  setupAvatarMedia();
}
