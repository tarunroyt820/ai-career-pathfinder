import tailwindAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            colors: {
                background:   "#140C30",
                "bg-alt":     "#14253E",
                "bg-elevated":"#153D4C",
                foreground:   "#FFFFFF",
                "fg-muted":   "#BDD8E9",
                "fg-dim":     "#7BBDE8",
                primary: {
                    DEFAULT:    "#16A085",
                    hover:      "#168777",
                    subtle:     "#156F69",
                    dim:        "#15565B",
                    foreground: "#FFFFFF",
                },
                card: {
                    DEFAULT:    "#14253E",
                    foreground: "#FFFFFF",
                },
                border:       "rgba(21,86,91,0.25)",
                "border-hl":  "rgba(22,160,133,0.35)",
                popover: {
                    DEFAULT: "#14253E",
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#14253E",
                    foreground: "#FFFFFF",
                },
                muted: {
                    DEFAULT: "#15565B",
                    foreground: "#7BBDE8",
                },
                accent: {
                    DEFAULT: "#16A085",
                    foreground: "#FFFFFF",
                },
                destructive: {
                    DEFAULT: "#dc2626",
                    foreground: "#FFFFFF",
                },
                input: "#14253E",
                ring: "#16A085",
                "vibrant-blue": "#2563eb",
                "vibrant-purple": "#7e22ce",
                "vibrant-pink": "#db2777",
                "vibrant-teal": "#0d9488",
                "vibrant-dark-blue": "#60a5fa",
                "vibrant-dark-purple": "#a855f7",
                "vibrant-dark-pink": "#f472b6",
                chart: {
                    1: "var(--chart-1)",
                    2: "var(--chart-2)",
                    3: "var(--chart-3)",
                    4: "var(--chart-4)",
                    5: "var(--chart-5)",
                },
            },
        },
    },
    plugins: [tailwindAnimate],
}
