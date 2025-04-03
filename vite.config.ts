import { defineConfig } from "vite";
import * as path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const file = fileURLToPath(new URL("package.json", import.meta.url));
const json = readFileSync(file, "utf8");
const pkg = JSON.parse(json);

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte()],
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    // base: process.env.NODE_ENV === "production" ? "/" : "/designer/",
    resolve: {
        alias: [
            {
                find: "#",
                replacement: path.resolve("./src"),
            },
        ],
    },
    // server: {
    //     headers: {
    //         "Content-Security-Policy":
    //             "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'",
    //     },
    // },
    // build: {
    //     commonjsOptions: {
    //         // include: ["@abstractplay/renderer", "@abstractplay/renderer/build/schemas/schema", "@abstractplay/renderer/build/renderers/_base", "@abstractplay/renderer/build"],
    //         include: [],
    //     },
    // }
});
