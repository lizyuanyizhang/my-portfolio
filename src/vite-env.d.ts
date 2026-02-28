/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AMAP_KEY: string
  readonly VITE_AMAP_SKIP_SECURITY: string
  readonly VITE_AMAP_SECURITY_CODE: string
  readonly VITE_YEAR_REVIEW_OWNER_KEY: string
  readonly VITE_CHAT_API_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
