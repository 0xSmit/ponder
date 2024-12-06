import { execa } from "execa";
import { defineConfig } from "tsup";

export default defineConfig({
  name: "@ponder/core",
  entry: {
    index: "src/index.ts",
    "bin/ponder": "src/bin/ponder.ts",
    "sync/eventDecoderWorker": "src/sync/eventDecoderWorker.ts",
  },
  outDir: "dist",
  format: ["esm"],
  sourcemap: true,
  dts: true,
  clean: true,
  splitting: true,
  onSuccess: async () => {
    try {
      await execa("pnpm", ["wagmi", "generate"]);
    } catch {}
  },
});
