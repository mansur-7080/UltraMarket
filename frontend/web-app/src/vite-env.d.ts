/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly hot?: {
    accept(): void
    accept(cb: () => void): void
    accept(deps: string[], cb: () => void): void
  }
} 