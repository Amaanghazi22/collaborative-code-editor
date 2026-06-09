/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COLLAB_CODE_BACKEND_URL: string;
  readonly VITE_COLLAB_CODE_SOCKET_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
