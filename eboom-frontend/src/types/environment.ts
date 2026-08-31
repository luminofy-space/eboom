export type TProcessEnv = {
  GENERATE_SOURCEMAP?: string;
  NEXT_PUBLIC_BASE_URL: string;
  NEXT_PUBLIC_TEST_MODE?: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required to augment the global NodeJS.ProcessEnv interface
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface merging is used purely to extend NodeJS.ProcessEnv
    interface ProcessEnv extends TProcessEnv {}
  }
}

export {};
