const LOG_PREFIX = '[GDF]';

export const logger = {
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.info(LOG_PREFIX, ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(LOG_PREFIX, ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(LOG_PREFIX, ...args);
    }
  },
};
