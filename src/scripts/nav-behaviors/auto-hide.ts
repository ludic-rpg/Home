import { NavBehavior } from './base';
import type { NavBehaviorConfig } from '../../types/navigation';

/**
 * Auto-hide navigation behavior
 * Hides header on scroll down, reveals on scroll up
 */
export class AutoHideNav extends NavBehavior {
  private lastScroll: number = 0;
  private isCompact: boolean = false;
  private ticking: boolean = false;
  private scrollHandler: () => void;
  private focusHandler: () => void;

  constructor(header: HTMLElement, config: NavBehaviorConfig) {
    super(header, config);

    // Bind handlers for proper cleanup
    this.scrollHandler = this.handleScroll.bind(this);
    this.focusHandler = this.handleFocus.bind(this);
  }

  init(): void {
    // Skip if user prefers reduced motion
    if (this.prefersReducedMotion()) {
      return;
    }

    // Add behavior class for CSS targeting
    this.addClass('nav-auto-hide');

    // Initialize last scroll position
    this.lastScroll = this.getScrollY();

    // Attach event listeners
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.header.addEventListener('focusin', this.focusHandler);

    this.isActive = true;
  }

  destroy(): void {
    if (!this.isActive) return;

    // Remove event listeners
    window.removeEventListener('scroll', this.scrollHandler);
    this.header.removeEventListener('focusin', this.focusHandler);

    // Remove behavior classes
    this.removeClass('nav-auto-hide');
    this.removeClass('nav-hidden');
    this.removeClass('nav-scrolled');

    this.isActive = false;
  }

  private handleScroll(): void {
    // Use requestAnimationFrame for smooth performance
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.updateVisibility();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private handleFocus(): void {
    // Always reveal header when navigation receives keyboard focus (accessibility)
    this.removeClass('nav-hidden');
  }

  private updateVisibility(): void {
    const currentScroll = this.getScrollY();
    const threshold = this.config.options?.threshold || 100; // Optimized: 50-100px is UX research sweet spot
    const showOnTop = this.config.options?.showOnTop ?? true;
    const compactEnterThreshold = 80;
    const compactExitThreshold = 24;
    const minScrollDelta = 6;
    const scrollDelta = currentScroll - this.lastScroll;

    // Compact mode changes header height. Use hysteresis so the page cannot
    // hover around one threshold and repeatedly show/hide the baseline.
    if (!this.isCompact && currentScroll > compactEnterThreshold) {
      this.addClass('nav-scrolled');
      this.isCompact = true;
    } else if (this.isCompact && currentScroll < compactExitThreshold) {
      this.removeClass('nav-scrolled');
      this.isCompact = false;
    }

    // Always show when at top of page
    if (showOnTop && currentScroll <= 0) {
      this.removeClass('nav-hidden');
      this.lastScroll = currentScroll;
      return;
    }

    // Don't hide until scroll threshold is reached
    if (currentScroll < threshold) {
      this.lastScroll = currentScroll;
      return;
    }

    // Ignore tiny browser/layout scroll adjustments around sticky transitions.
    if (Math.abs(scrollDelta) < minScrollDelta) {
      return;
    }

    // Determine scroll direction and update visibility
    if (scrollDelta > 0) {
      // Scrolling down - hide header
      this.addClass('nav-hidden');
    } else {
      // Scrolling up - show header
      this.removeClass('nav-hidden');
    }

    this.lastScroll = currentScroll;
  }
}
