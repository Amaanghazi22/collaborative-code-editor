/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COLLAB_CODE_BACKEND_URL: string;
  readonly VITE_COLLAB_CODE_SOCKET_URL: string;
  readonly VITE_JUDGE0_URL?: string;
  readonly VITE_JUDGE0_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
