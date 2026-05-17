import { NavBehavior } from './base';

/**
 * Sticky navigation behavior
 * CSS-only sticky positioning (no JavaScript needed)
 * This class exists for consistency but performs minimal work
 */
export class StickyNav extends NavBehavior {
  init(): void {
    // Add class for potential CSS targeting
    this.addClass('nav-sticky');
    this.isActive = true;
  }

  destroy(): void {
    if (!this.isActive) return;

    this.removeClass('nav-sticky');
    this.isActive = false;
  }
}
