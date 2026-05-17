/**
 * Navigation behavior system types
 * Defines available behaviors and their configurations
 */

/**
 * Available navigation behaviors
 */
export type NavBehavior =
  | 'sticky'      // Always visible, sticky to top (CSS-only, no JS)
  | 'auto-hide'   // Hides on scroll down, reveals on scroll up
  | 'static';     // Normal document flow, no sticky positioning

/**
 * Configuration options for navigation behaviors
 */
export interface NavBehaviorConfig {
  behavior: NavBehavior;
  options?: {
    /** Scroll threshold (px) before behavior activates */
    threshold?: number;
    /** Animation duration (ms) */
    duration?: number;
    /** Always show when scroll position is at top (0) */
    showOnTop?: boolean;
  };
}

/**
 * Default configurations for each behavior
 */
export const DEFAULT_NAV_CONFIG: Record<NavBehavior, NavBehaviorConfig> = {
  'sticky': {
    behavior: 'sticky',
  },
  'auto-hide': {
    behavior: 'auto-hide',
    options: {
      threshold: 150,
      duration: 300,
      showOnTop: true,
    },
  },
  'static': {
    behavior: 'static',
  },
};
