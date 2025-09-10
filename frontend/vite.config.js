import { resolve, basename } from "path";
import fs from "fs";
import { defineConfig, loadEnv } from "vite";
import { createMultiHtmlPlugin } from "vite-plugin-multi-html";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    root: "./routes",
    // Dev server
    server: {
      port: Number(env.PORT) || 5173,
    },
    plugins: [
      createMultiHtmlPlugin({
        variables: {
          lang: env.VITE_LANG,
          name: env.VITE_NAME,
          description: env.VITE_DESCRIPTION,
        }
      })
    ],
    build: {
      outDir: "../build",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[hash].js",
          chunkFileNames: "assets/[hash].js",
          assetFileNames: (i) => {
            if (/\.(a?png|jpe?g|gif|webp|mp3|m4a|mp4|mov|webm)$/.test(i.name)) {
              return "assets/img/[name][extname]";
            }
            return "assets/[hash][extname]";
          },
        },
      },
    },
  };
});
