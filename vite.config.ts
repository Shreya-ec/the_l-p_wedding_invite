import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Absolute site origin for link previews. Vercel sets this during the build. */
function siteOrigin(): Plugin {
  return {
    name: "site-origin",
    transformIndexHtml(html) {
      const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "";
      const origin = host ? `https://${host}` : "https://lakshay-weds-prerna.vercel.app";
      return html.replaceAll("%SITE_ORIGIN%", origin);
    },
  };
}

export default defineConfig({
  plugins: [react(), siteOrigin()],
});
