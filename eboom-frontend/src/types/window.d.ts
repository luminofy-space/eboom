import type { TProcessEnv } from './environment';

declare global {
  interface Window {
    __env?: Partial<Record<keyof TProcessEnv | string, string>>;
  }
}

export {};
