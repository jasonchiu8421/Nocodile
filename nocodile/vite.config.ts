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
          browsers: ["supports css-matches-pseudo and > 0.1% and not op_mini all and not dead"]
        })
      ]
    }
  }
})
