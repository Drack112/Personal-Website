import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL;
  const site = (
    env.VITE_SITE_URL || (vercel ? `https://${vercel}` : "")
  ).replace(/\/+$/, "");
  if (command === "build" && !site) {
    console.warn(
      "[site-url] VITE_SITE_URL is not set: share cards will use relative URLs, which most apps ignore.",
    );
  }

  return {
    plugins: [
      vue(),
      vueDevTools(),
      {
        name: "site-url",
        transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", site),
      },
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    // `npm run dev` borrows the deployed /api (or API_PROXY's). To work on the
    // functions themselves, run `npx vercel dev`, which serves the app and api/ together.
    server: {
      proxy: {
        "/api": {
          target: env.API_PROXY || "https://website-psi-ten-90.vercel.app",
          changeOrigin: true,
        },
      },
    },
  };
});
