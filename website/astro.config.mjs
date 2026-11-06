import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Canonical origin. Override with SITE_URL for previews; production defaults to the live domain.
const siteUrl = (process.env.SITE_URL ?? "https://nayki.theshriks.space").replace(/\/+$/, "");

export default defineConfig({
  site: siteUrl,
  output: "static",
  // Keep scripts as separate files so a strict Content-Security-Policy can be added later.
  vite: { build: { assetsInlineLimit: 0 } },
  integrations: [sitemap({ filter: (page) => !page.includes("/404") })],
});
