/**
 * Navigation behavior factory
 * Creates and returns the appropriate behavior instance based on configuration
 */

import { NavBehavior } from './base';
import { AutoHideNav } from './auto-hide';
import { StickyNav } from './sticky';
import type { NavBehaviorConfig } from '../../types/navigation';

/**
 * Factory function to create navigation behavior instances
 * @param header - The header HTML element
 * @param config - Behavior configuration
 * @returns Instantiated behavior class
 */
export function createNavBehavior(
  header: HTMLElement,
  config: NavBehaviorConfig
): NavBehavior {
  switch (config.behavior) {
    case 'auto-hide':
      return new AutoHideNav(header, config);

    case 'sticky':
      return new StickyNav(header, config);

    case 'static':
      // Static positioning has no JavaScript behavior
      return new StickyNav(header, { behavior: 'static' });

    default:
      console.warn(
        `[NavBehavior] Unknown behavior: ${config.behavior}, falling back to sticky`
      );
      return new StickyNav(header, config);
  }
}

// Re-export for convenience
export { NavBehavior } from './base';
export { AutoHideNav } from './auto-hide';
export { StickyNav } from './sticky';
