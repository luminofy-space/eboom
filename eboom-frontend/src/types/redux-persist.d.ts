declare module "redux-persist/lib/storage/createWebStorage" {
  import type { WebStorage } from "redux-persist";
  export default function createWebStorage(type: "local" | "session"): WebStorage;
}
