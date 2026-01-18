/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WORKSPACE_ID: string
  readonly VITE_API_KEY: string
  readonly VITE_AGENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
