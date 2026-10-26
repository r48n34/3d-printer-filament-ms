import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tabToComponents } from "tab-to-components";
// import { reactClickToComponent } from "vite-plugin-react-click-to-component";

export default defineConfig(() => {
    if (!process.env.VITE_LAUNCH_EDITOR) {
        process.env.LAUNCH_EDITOR = "code";
    } else {
        process.env.LAUNCH_EDITOR = process.env.VITE_LAUNCH_EDITOR;
    }

    return {
        plugins: [
            // command === "serve" && reactClickToComponent(),
            react(),
            tabToComponents({
                editor: process.env.LAUNCH_EDITOR || "code",
            }),
        ].filter(Boolean),
    };
});
