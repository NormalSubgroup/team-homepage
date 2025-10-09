/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEAM_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
