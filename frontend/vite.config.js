import { defineConfig, loadEnv } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    root: "./routes",
    server: {
      port: Number(env.PORT) || 5173,
    },
    plugins: [
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            lang: env.VITE_LANG,
            name: env?.VITE_NAME,
          },
        },
      }),
    ],
    build: {
      outDir: "./build",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[hash].js",
          chunkFileNames: "assets/[hash].js",
          assetFileNames: (i) => {
            if (/\.(a?png|jpe?g|gif|webp|mp3|m4a|mp4|mov|webm)$/.test(i.name)) {
              return "assets/img/[name][extname]"; // Image / Video
            }
            return "assets/[hash][extname]";
          },
        },
      },
    },
  }
});
