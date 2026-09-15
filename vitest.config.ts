import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [["src/frontend/**/*.test.ts", "jsdom"]],
    include: ["src/worker/**/*.test.ts", "src/frontend/**/*.test.ts"],
  },
});
