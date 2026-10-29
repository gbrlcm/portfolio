// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://gabrielcampos.dev",

  i18n: {
    defaultLocale: "pt",
    locales: ["pt", "en", "es"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    inlineStylesheets: "always",
  },

  integrations: [icon()],
});