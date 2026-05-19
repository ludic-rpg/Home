/**
 * Hero Section Scroll Animation
 *
 * Triggers animations when the hero section becomes visible:
 * 1. Avatar reveals with circular iris/mask effect
 * 2. Latest post bubble pops in with shake effect
 *
 * Respects prefers-reduced-motion for accessibility.
 */

export function initHeroAnimations() {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const triggerAboutAnimation = () => {
    const aboutSection = document.querySelector('.about-section');
    if (!aboutSection) return false;

    const avatar = aboutSection.querySelector('.about-avatar');
    const bubble = aboutSection.querySelector('.about-content h2:first-of-type');

    if (prefersReducedMotion) {
      if (avatar) avatar.classList.add('animate-in', 'no-motion');
      if (bubble) bubble.classList.add('animate-in', 'no-motion');
      return true;
    }

    window.requestAnimationFrame(() => {
      if (avatar) avatar.classList.add('animate-in');
      if (bubble) bubble.classList.add('animate-in');
    });

    return true;
  };

  // About has its own intro: it is above the fold, so it should start ASAP.
  if (triggerAboutAnimation()) return;

  const animationTargets = [
    {
      sectionSelector: '.hero',
      avatarSelector: '.hero-avatar',
      bubbleSelector: '.hero-latest',
      triggerDelay: 0,
    },
  ];

  // If reduced motion is preferred, show elements immediately without animation
  if (prefersReducedMotion) {
    animationTargets.forEach(({ avatarSelector, bubbleSelector }) => {
      const avatar = document.querySelector(avatarSelector);
      const bubble = document.querySelector(bubbleSelector);

      if (avatar) avatar.classList.add('animate-in', 'no-motion');
      if (bubble) bubble.classList.add('animate-in', 'no-motion');
    });
    return;
  }

  animationTargets.forEach(({ sectionSelector, avatarSelector, bubbleSelector, triggerDelay }) => {
    const section = document.querySelector(sectionSelector);
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only trigger when entering viewport
          if (entry.isIntersecting) {
            const avatar = section.querySelector(avatarSelector);
            const bubble = section.querySelector(bubbleSelector);

            window.setTimeout(() => {
              window.requestAnimationFrame(() => {
                // Trigger avatar animation immediately
                if (avatar) {
                  avatar.classList.add('animate-in');
                }

                // Trigger bubble animation after avatar starts (400ms delay in CSS)
                if (bubble) {
                  bubble.classList.add('animate-in');
                }
              });
            }, triggerDelay);

            // Disconnect observer after first trigger (animate only once)
            observer.disconnect();
          }
        });
      },
      {
        // Trigger when 10% of the section is visible
        threshold: 0.1,
        // Start observing slightly before it enters viewport
        rootMargin: '0px 0px -10% 0px',
      }
    );

    // Start observing
    observer.observe(section);
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroAnimations);
} else {
  // DOM already loaded
  initHeroAnimations();
}
