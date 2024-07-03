import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        "adapters/http": "src/adapters/http.ts",
        "adapters/next": "src/adapters/next.ts",
        "adapters/ws": "src/adapters/ws.ts",
    },
    format: ["cjs", "esm"],
    outDir: "dist",
    splitting: false,
    esbuildOptions: (options, context) => {
        if (context.format === "esm") {
            options.outExtension = { ".js": ".mjs" }; // Use .mjs for ESM
        } else if (context.format === "cjs") {
            options.outExtension = { ".js": ".cjs" }; // Use .cjs for CJS
        }
    },
});
