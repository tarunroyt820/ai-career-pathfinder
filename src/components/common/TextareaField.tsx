import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
}

export function TextareaField({ label, error, ...props }: TextareaFieldProps) {
    return (
        <div className="grid w-full items-center gap-1.5">
            <Label htmlFor={props.id}>{label}</Label>
            <Textarea {...props} />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
