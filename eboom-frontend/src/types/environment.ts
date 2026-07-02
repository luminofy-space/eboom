export type TProcessEnv = {
  GENERATE_SOURCEMAP?: string;
  NEXT_PUBLIC_BASE_URL: string;
  NEXT_PUBLIC_TEST_MODE?: string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends TProcessEnv {}
  }
}

export {};
