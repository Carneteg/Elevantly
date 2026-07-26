import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  resolve: {
    // Matcha Next:s "@/*"-alias (relativt apps/web-roten).
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
