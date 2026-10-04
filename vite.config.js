import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tailwindcss(),
      react(),
      nodePolyfills({
        // Whether to polyfill specific globals.
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        // Whether to polyfill Node.js built-in modules.
        protocolImports: true,
      }),
    ],
    optimizeDeps: {
      exclude: ["lucide-react"],
      // Only scan actual source files, not docs
      entries: ["index.html", "src/**/*.{js,jsx}"],
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
    resolve: {
      extensions: [".js", ".jsx"],
      alias: {
        "@": "/src",
      },
    },
    define: {
      // Make Firebase environment variables available to the client
      "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify(env.VITE_FIREBASE_API_KEY),
      "import.meta.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      "import.meta.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      "import.meta.env.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      "import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      "import.meta.env.VITE_FIREBASE_APP_ID": JSON.stringify(env.VITE_FIREBASE_APP_ID),
      "import.meta.env.VITE_FIREBASE_MEASUREMENT_ID": JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
    },
    server: {
      port: 3000,
      open: true,
      fs: {
        // Deny access to docs folder to prevent Vite from scanning it
        deny: ['**/docs/**'],
      },
      // Proxy API routes to Vercel dev server (if running)
      // If Vercel dev isn't running, API calls will gracefully fail
      proxy: {
        '/api': {
          target: 'http://localhost:3001', // Vercel dev server port
          changeOrigin: true,
          secure: false,
          ws: false, // Disable websocket proxying
        },
      },
    },
  };
});
