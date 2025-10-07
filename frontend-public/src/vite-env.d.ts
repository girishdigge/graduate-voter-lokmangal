/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;
  readonly VITE_ENABLE_CONTACT_PICKER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
