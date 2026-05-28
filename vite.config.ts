import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react-dom") ||
              id.includes("react/") ||
              id.includes("react-jsx-runtime") ||
              id.includes("react-router-dom") ||
              id.includes("react-router/") ||
              id.includes("scheduler")
            ) {
              return "vendor-framework";
            }

            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }

            if (id.includes("@tanstack/react-query")) {
              return "vendor-query";
            }

            if (id.includes("recharts")) {
              return "vendor-charts";
            }

            if (id.includes("react-markdown")) {
              return "vendor-markdown";
            }

            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            if (id.includes("sonner")) {
              return "vendor-toast";
            }

            return "vendor";
          }
        },
      },
    },
  },
})
