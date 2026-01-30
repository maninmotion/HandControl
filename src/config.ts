/**
 * Application Configuration
 *
 * DEBUG_MODE: Set to true to enable console.log output for debugging
 *             Set to false for production use
 */
export const CONFIG = {
  DEBUG_MODE: false,
};

/**
 * Debug logger - only outputs when DEBUG_MODE is true
 */
export const debug = {
  log: (...args: unknown[]) => {
    if (CONFIG.DEBUG_MODE) {
      console.log(...args);
    }
  },
};
