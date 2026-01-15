import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If deploying to GitHub Pages at /<repo>/,
// uncomment the 'base' line and set it to "/<repo>/"
// base: "/<repo>/",

export default defineConfig({
  plugins: [react()],
  base: "/the-student-repo/",
});
