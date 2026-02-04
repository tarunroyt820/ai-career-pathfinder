import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    containerClassName?: string;
}

export function InputField({ label, error, containerClassName, ...props }: InputFieldProps) {
    return (
        <div className={`grid w-full items-center gap-1.5 ${containerClassName || ""}`}>
            {label && <Label htmlFor={props.id}>{label}</Label>}
            <Input {...props} />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
