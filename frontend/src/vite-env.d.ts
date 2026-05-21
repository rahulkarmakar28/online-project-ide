/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WORKER_TERMINAL_URL: string
  readonly VITE_WORKER_EDITOR_URL: string
  // add other env vars here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
