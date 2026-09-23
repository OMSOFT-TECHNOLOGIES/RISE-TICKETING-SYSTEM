/** Shared Vite environment (dev vs production builds). */
export const appEnv = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8081',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? '',
} as const;
