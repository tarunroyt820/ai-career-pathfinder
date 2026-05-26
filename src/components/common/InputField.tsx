import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    containerClassName?: string;
}

export function InputField({ label, error, containerClassName, className, ...props }: InputFieldProps & { className?: string }) {
    const isPasswordField = props.type === "password";
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const resolvedType = isPasswordField
        ? (isPasswordVisible ? "text" : "password")
        : props.type;

    return (
        <div className={`grid w-full items-center gap-2 ${containerClassName || ""}`}>
            {label && (
                <Label
                    htmlFor={props.id}
                    className="text-[#BDD8E9] text-xs font-black uppercase tracking-widest"
                >
                    {label}
                </Label>
            )}
            <div className="relative">
                <Input
                    className={`w-full bg-[rgba(13,17,40,0.80)] border border-[rgba(22,160,133,0.30)] text-white placeholder-[rgba(189,216,233,0.40)] rounded-xl px-4 py-3 focus:outline-none focus:border-[#16A085] focus:ring-2 focus:ring-[rgba(22,160,133,0.20)] transition-all duration-200 ${isPasswordField ? "pr-12" : ""} ${className}`}
                    {...props}
                    type={resolvedType}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setIsPasswordVisible((current) => !current)}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-[rgba(189,216,233,0.65)] transition-colors hover:text-white"
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                    >
                        {isPasswordVisible ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
            {error && <p className="text-[10px] font-bold text-destructive pl-1 uppercase tracking-widest">{error}</p>}
        </div>
    );
}
