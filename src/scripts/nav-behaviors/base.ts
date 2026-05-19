import type { NavBehaviorConfig } from '../../types/navigation';

/**
 * Base class for all navigation behaviors
 * Provides common utilities and consistent interface
 */
export abstract class NavBehavior {
  protected header: HTMLElement;
  protected config: NavBehaviorConfig;
  protected isActive: boolean = false;

  constructor(header: HTMLElement, config: NavBehaviorConfig) {
    this.header = header;
    this.config = config;
  }

  /**
   * Initialize behavior
   * Called once when page loads
   */
  abstract init(): void;

  /**
   * Cleanup behavior
   * Called on page unload or when behavior needs to be removed
   */
  abstract destroy(): void;

  /**
   * Check if user prefers reduced motion
   */
  protected prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get current scroll position
   */
  protected getScrollY(): number {
    return window.scrollY || window.pageYOffset;
  }

  /**
   * Safely add CSS class to header
   */
  protected addClass(className: string): void {
    this.header.classList.add(className);
  }

  /**
   * Safely remove CSS class from header
   */
  protected removeClass(className: string): void {
    this.header.classList.remove(className);
  }

  /**
   * Check if behavior is currently active
   */
  public isActiveBehavior(): boolean {
    return this.isActive;
  }
}
