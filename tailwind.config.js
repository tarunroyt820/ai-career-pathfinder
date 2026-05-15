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
                background:   "#EEF4F8",
                "bg-alt":     "#E2ECF5",
                "bg-elevated":"#FFFFFF",
                foreground:   "#1A2433",
                "fg-muted":   "#64748B",
                "fg-dim":     "#94A3B8",
                primary: {
                    DEFAULT:    "#2D8C7F",
                    hover:      "#26776D",
                    subtle:     "#34D399",
                    dim:        "#6EE7B7",
                    foreground: "#FFFFFF",
                },
                card: {
                    DEFAULT:    "rgba(255,255,255,0.72)",
                    foreground: "#1A2433",
                },
                border:       "#D7E3EC",
                "border-hl":  "rgba(45,140,127,0.14)",
                popover: {
                    DEFAULT: "rgba(255,255,255,0.72)",
                    foreground: "#1A2433",
                },
                secondary: {
                    DEFAULT: "#E2ECF5",
                    foreground: "#1A2433",
                },
                muted: {
                    DEFAULT: "#D7E3EC",
                    foreground: "#64748B",
                },
                accent: {
                    DEFAULT: "#2D8C7F",
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
