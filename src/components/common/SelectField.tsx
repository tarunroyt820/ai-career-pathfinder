import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SelectFieldProps {
    label: string;
    placeholder?: string;
    options: { label: string; value: string }[];
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    id?: string;
}

export function SelectField({ label, placeholder, options, value, onChange, error, id }: SelectFieldProps) {
    return (
        <div className="grid w-full items-center gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={id}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
