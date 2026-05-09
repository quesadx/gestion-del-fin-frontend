const LOG_PREFIX = '[GDF]';

export const logger = {
  info: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(LOG_PREFIX, ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(LOG_PREFIX, ...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors even in production
    // eslint-disable-next-line no-console
    console.error(LOG_PREFIX, ...args);
  },
};
