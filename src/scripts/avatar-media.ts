const setupAvatarMedia = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const avatars = document.querySelectorAll<HTMLElement>('[data-avatar-media]');

  avatars.forEach((avatar) => {
    if (avatar.dataset.avatarReady === 'true') return;
    avatar.dataset.avatarReady = 'true';

    const randomVideo = avatar.querySelector<HTMLVideoElement>('[data-avatar-random-video]');
    const hoverVideo = avatar.querySelector<HTMLVideoElement>('[data-avatar-hover-video]');
    if (prefersReducedMotion) return;

    const isPlaying = () => (
      avatar.classList.contains('is-video-ready') ||
      avatar.classList.contains('is-hover-video-ready')
    );

    const hideRandomVideo = () => {
      avatar.classList.remove('is-video-ready');
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
      if (isPlaying()) return;

      hoverVideo.currentTime = 0;
      hoverVideo.play().catch(hideHoverVideo);
    };

    const hoverVideoSrc = avatar.dataset.avatarHoverSrc;
    if (hoverVideo && hoverVideoSrc) {
      hoverVideo.addEventListener('playing', () => {
        avatar.classList.add('is-hover-video-ready');
      });
      hoverVideo.addEventListener('ended', hideHoverVideo);

      hoverVideo.src = hoverVideoSrc;
      hoverVideo.preload = 'auto';
      hoverVideo.load();

      avatar.addEventListener('mouseenter', playHoverVideo);
      avatar.addEventListener('focusin', playHoverVideo);
    }

    if (!randomVideo) return;

    const chance = Number.parseFloat(avatar.dataset.avatarChance ?? '0.2');
    const rollChance = Number.isFinite(chance) ? chance : 0.2;
    const chanceStep = Number.parseFloat(avatar.dataset.avatarChanceStep ?? '0.2');
    const rollChanceStep = Number.isFinite(chanceStep) ? chanceStep : 0.2;
    let currentRollChance = rollChance;

    const videoSrcs = (avatar.dataset.avatarVideoSrcs ?? '').split(/\s+/).filter(Boolean);
    if (videoSrcs.length === 0) return;

    randomVideo.addEventListener('playing', () => {
      avatar.classList.add('is-video-ready');
    });

    randomVideo.addEventListener('ended', hideRandomVideo);

    const playRandomVideo = (force = false) => {
      if (isPlaying() || avatar.matches(':hover')) return;
      if (!force && Math.random() > currentRollChance) {
        currentRollChance = Math.min(1, currentRollChance + rollChanceStep);
        return;
      }

      const videoSrc = videoSrcs[Math.floor(Math.random() * videoSrcs.length)];
      if (!videoSrc) return;

      currentRollChance = rollChance;

      const playWhenReady = () => {
        if (isPlaying() || avatar.matches(':hover')) return;
        randomVideo.currentTime = 0;
        randomVideo.play().catch(hideRandomVideo);
      };

      if (randomVideo.getAttribute('src') !== videoSrc) {
        randomVideo.src = videoSrc;
        randomVideo.addEventListener('canplay', playWhenReady, { once: true });
        randomVideo.load();
        return;
      }

      playWhenReady();
    };

    playRandomVideo(true);
    window.setInterval(() => playRandomVideo(false), 5000);
  });
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

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    setupAfterPageLoad();
  }, { timeout: 2500 });
} else {
  setupAfterPageLoad();
}
