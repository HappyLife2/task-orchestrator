import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#2c2d65", // deep blue
                    foreground: "#ffffff",
                },
                accent: {
                    DEFAULT: "#e0592a", // orange
                    foreground: "#ffffff",
                },
                card: "rgba(255,255,255,0.06)",
                border: "rgba(255,255,255,0.12)",
            },
            fontFamily: {
                sans: ["var(--font-alexandria)", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
