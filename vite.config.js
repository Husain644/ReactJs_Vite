import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Must match <Router basename="/three"> in src/App.jsx
  base: "/three/",
  plugins: [react()],
  server: {
    // Keep HMR on for dev — a disabled HMR means edits require a full
    // manual refresh, which can look like a routing bug that "won't fix"
    // even after the code is corrected.
    hmr: true,
  },
})
