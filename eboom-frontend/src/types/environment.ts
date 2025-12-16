declare global {
    namespace NodeJS {
      type ProcessEnv = TProcessEnv;
    }
    interface Window {
      __env: any;
    }
  }

export type TProcessEnv = {
    GENERATE_SOURCEMAP: boolean;
    NEXT_PUBLIC_BASE_URL: string;
  };