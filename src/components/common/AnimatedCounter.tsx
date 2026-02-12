import { useEffect, useState } from "react";
import { useMotionValue, useSpring, useTransform, animate } from "framer-motion";

interface AnimatedCounterProps {
    target: number;
    duration?: number;
    suffix?: string;
    decimals?: number;
}

export function AnimatedCounter({
    target,
    duration = 1.2,
    suffix = "",
    decimals = 2
}: AnimatedCounterProps) {
    const count = useMotionValue(0);
    const [displayValue, setDisplayValue] = useState("0.00");

    useEffect(() => {
        const controls = animate(count, target, {
            duration: duration,
            ease: "easeOut",
        });

        return controls.stop;
    }, [target, duration, count]);

    useEffect(() => {
        return count.on("change", (latest) => {
            setDisplayValue(latest.toFixed(decimals));
        });
    }, [count, decimals]);

    return (
        <span>
            {displayValue}{suffix}
        </span>
    );
}
