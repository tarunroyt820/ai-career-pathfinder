import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/images/nextaro-logo.png";

interface LogoProps {
    className?: string; // For extra styling if needed
    size?: "sm" | "md" | "lg" | "xl";
    onClick?: () => void; // Optional override
    onDoubleClick?: () => void;
}

/**
 * Shared Logo Component to ensure consistent branding and navigation.
 * 
 * Sizes:
 * - sm: h-12 (Navbar)
 * - md: h-16 (Auth Pages, Footer)
 * - lg: h-20 (Sidebar)
 * - xl: h-24 (Large Hero Usage)
 */
export function Logo({ className = "", size = "md", onClick, onDoubleClick }: LogoProps) {
    const navigate = useNavigate();
    const _location = useLocation();

    const handleLogoClick = () => {
        // 1. If explicit onClick provided, use it
        if (onClick) {
            onClick();
            return;
        }

        // 2. Default Navigation Logic
        // If we have history (length > 1), try to go back
        // Otherwise fallback to home (/)
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    const sizeClasses = {
        sm: "h-12",
        md: "h-[80px]",
        lg: "h-[90px]",
        xl: "h-28"
    };

    return (
        <div
            onClick={handleLogoClick}
            onDoubleClick={onDoubleClick}
            className={`cursor-pointer inline-flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${className}`}
            role="button"
            tabIndex={0}
            aria-label="Nextaro Logo"
            style={{ background: 'transparent' }}
        >
            <img
                src={`${logo}?v=3`}
                alt="Nextaro"
                className={`${sizeClasses[size]} w-auto object-contain`}
                style={{ mixBlendMode: 'screen', background: 'transparent' }}
                key={Date.now()}
            />
        </div>
    );
}
