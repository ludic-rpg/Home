const setupAvatarMedia = (selector = '[data-avatar-media]') => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = 'connection' in navigator
    ? navigator.connection as {
      effectiveType?: string;
      saveData?: boolean;
    }
    : undefined;
  const shouldSkipVideo = (
    prefersReducedMotion ||
    connection?.saveData ||
    ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '')
  );
  const maxLoadedClipCount = window.matchMedia('(max-width: 768px)').matches ? 3 : Number.POSITIVE_INFINITY;
  const avatars = document.querySelectorAll<HTMLElement>(selector);

  avatars.forEach((avatar) => {
    if (avatar.dataset.avatarReady === 'true') return;
    avatar.dataset.avatarReady = 'true';

    const randomVideo = avatar.querySelector<HTMLVideoElement>('[data-avatar-random-video]');
    const hoverVideo = avatar.querySelector<HTMLVideoElement>('[data-avatar-hover-video]');
    if (shouldSkipVideo) return;

    let isLoadingRandomVideo = false;
    let loadedClipCount = 0;

    const canLoadClip = (video: HTMLVideoElement, videoSrc: string) => (
      video.getAttribute('src') === videoSrc ||
      loadedClipCount < maxLoadedClipCount
    );

    const loadClip = (video: HTMLVideoElement, videoSrc: string) => {
      if (video.getAttribute('src') === videoSrc) return true;
      if (loadedClipCount >= maxLoadedClipCount) return false;

      video.src = videoSrc;
      loadedClipCount += 1;
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
    let nextVideoIndex = 0;

    randomVideo.addEventListener('playing', () => {
      isLoadingRandomVideo = false;
      avatar.classList.add('is-video-ready');
    });

    randomVideo.addEventListener('ended', hideRandomVideo);
    randomVideo.addEventListener('error', hideRandomVideo);

    const getNextVideoSrc = () => {
      const videoSrc = videoSrcs[nextVideoIndex];
      nextVideoIndex = (nextVideoIndex + 1) % videoSrcs.length;
      return videoSrc;
    };

    const selectVideoSrc = (preferredVideoSrc = '') => {
      if (!preferredVideoSrc) return getNextVideoSrc();

      const preferredIndex = videoSrcs.indexOf(preferredVideoSrc);
      if (preferredIndex !== -1) {
        nextVideoIndex = (preferredIndex + 1) % videoSrcs.length;
      }

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
  });
};

const setupPriorityAvatarMedia = () => {
  setupAvatarMedia('[data-avatar-media][data-avatar-play-immediately="true"]');
};

const setupAfterPageLoad = () => {
  const run = () => {
    window.setTimeout(setupAvatarMedia, 500);
  };

  if (document.readyState === 'complete') {
    run();
    return;
  }

  window.addEventListener('load', run, { once: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPriorityAvatarMedia, { once: true });
} else {
  setupPriorityAvatarMedia();
}

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    setupAfterPageLoad();
  }, { timeout: 2500 });
} else {
  setupAfterPageLoad();
}
