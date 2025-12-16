'use client';

import type { TProcessEnv } from "@/src/types/environment";

function isBrowser() {
  return Boolean(typeof window !== 'undefined' && window.__env);
}

export function env(key: keyof TProcessEnv | string): string {
  if (!key.length) {
    throw new Error('No env key provided');
  }

  // Check window.__env first (for runtime injection)
  if (isBrowser() && window.__env && window.__env[key] !== undefined) {
    return window.__env[key] === '' ? '' : (window.__env[key] || '');
  }

  // Fall back to process.env (Next.js exposes NEXT_PUBLIC_* vars here)
  const value = process.env[key];
  
  if (value === undefined || value === null) {
    return '';
  }

  return value === '' ? '' : value;
}
