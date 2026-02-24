import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  define: {
    // For Vercel production, we'll use the deployed backend URL
    __API_BASE_URL__: JSON.stringify(
      process.env.NODE_ENV === 'production'
        ? 'https://learning-management-system-be.onrender.com' // Your backend URL from vercel.json
        : '/api'
    )
  }
});

