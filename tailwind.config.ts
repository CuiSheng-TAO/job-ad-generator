import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                kaiti: ["KaiTi", "STKaiti", "serif"],
                serif: ["Times New Roman", "Times", "serif"],
            },
        },
    },
    plugins: [],
};
export default config;
