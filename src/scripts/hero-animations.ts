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

  // If reduced motion is preferred, show elements immediately without animation
  if (prefersReducedMotion) {
    const avatar = document.querySelector('.hero-avatar');
    const bubble = document.querySelector('.hero-latest');

    if (avatar) avatar.classList.add('animate-in', 'no-motion');
    if (bubble) bubble.classList.add('animate-in', 'no-motion');
    return;
  }

  // Find the hero section
  const heroSection = document.querySelector('.hero');
  if (!heroSection) return;

  // Create Intersection Observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Only trigger when entering viewport
        if (entry.isIntersecting) {
          const avatar = heroSection.querySelector('.hero-avatar');
          const bubble = heroSection.querySelector('.hero-latest');

          // Trigger avatar animation immediately
          if (avatar) {
            avatar.classList.add('animate-in');
          }

          // Trigger bubble animation after avatar starts (400ms delay in CSS)
          if (bubble) {
            bubble.classList.add('animate-in');
          }

          // Disconnect observer after first trigger (animate only once)
          observer.disconnect();
        }
      });
    },
    {
      // Trigger when 10% of hero is visible
      threshold: 0.1,
      // Start observing slightly before it enters viewport
      rootMargin: '0px 0px -10% 0px',
    }
  );

  // Start observing
  observer.observe(heroSection);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroAnimations);
} else {
  // DOM already loaded
  initHeroAnimations();
}
