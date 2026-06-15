'use client';

import type { TProcessEnv } from "@/src/types/environment";

// Static access is required — Next.js only inlines NEXT_PUBLIC_* at build time
// when referenced literally, not via process.env[dynamicKey].
const publicEnv: Record<keyof TProcessEnv, string | undefined> = {
  GENERATE_SOURCEMAP: process.env.GENERATE_SOURCEMAP,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE,
};

export function env(key: keyof TProcessEnv | string): string {
  if (!key.length) {
    throw new Error('No env key provided');
  }

  if (typeof window !== 'undefined' && window.__env?.[key] !== undefined) {
    const injected = window.__env[key];
    return injected === '' ? '' : (injected || '');
  }

  const value = publicEnv[key as keyof TProcessEnv] ?? process.env[key];

  if (value === undefined || value === null) {
    return '';
  }

  return value === '' ? '' : value;
}
