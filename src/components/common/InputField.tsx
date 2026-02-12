import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    containerClassName?: string;
}

export function InputField({ label, error, containerClassName, className, ...props }: InputFieldProps & { className?: string }) {
    return (
        <div className={`grid w-full items-center gap-2 ${containerClassName || ""}`}>
            {label && (
                <Label
                    htmlFor={props.id}
                    className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 pl-1"
                >
                    {label}
                </Label>
            )}
            <Input
                className={`rounded-2xl border-border/40 focus:ring-2 focus:ring-primary/20 hover:border-border transition-all font-semibold ${className}`}
                {...props}
            />
            {error && <p className="text-[10px] font-bold text-destructive pl-1 uppercase tracking-widest">{error}</p>}
        </div>
    );
}
