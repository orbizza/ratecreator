import type { Config } from "tailwindcss";
import sharedConfig from "@ratecreator/tailwind-config";

const config: Pick<Config, "content" | "presets"> = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  presets: [sharedConfig],
};

export default config;
