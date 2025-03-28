import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"
import postcssPresetEnv from "postcss-preset-env"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins:[
        postcssPresetEnv({
          browsers: ["defaults and supports css-matches-pseudo"],
          features: {
            'is-pseudo-class': false,
            'nesting-rules': true,
          },
          stage: 1
        })
      ]
    }
  }
})
