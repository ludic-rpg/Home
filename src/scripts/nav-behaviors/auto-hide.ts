import { NavBehavior } from './base';
import type { NavBehaviorConfig } from '../../types/navigation';

/**
 * Auto-hide navigation behavior
 * Hides header on scroll down, reveals on scroll up
 */
export class AutoHideNav extends NavBehavior {
  private lastScroll: number = 0;
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
    const compactThreshold = 50; // Threshold for compact mode

    // Toggle compact mode (for mobile size reduction)
    if (currentScroll > compactThreshold) {
      this.addClass('nav-scrolled');
    } else {
      this.removeClass('nav-scrolled');
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

    // Determine scroll direction and update visibility
    if (currentScroll > this.lastScroll) {
      // Scrolling down - hide header
      this.addClass('nav-hidden');
    } else if (currentScroll < this.lastScroll) {
      // Scrolling up - show header
      this.removeClass('nav-hidden');
    }

    this.lastScroll = currentScroll;
  }
}
