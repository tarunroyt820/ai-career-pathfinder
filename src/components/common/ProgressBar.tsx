import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface ProgressBarProps {
    label?: string;
    value: number;
    max?: number;
    showValue?: boolean;
}

export function ProgressBar({ label, value, max = 100, showValue = false }: ProgressBarProps) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                {label && <Label>{label}</Label>}
                {showValue && <span className="text-muted-foreground">{value}%</span>}
            </div>
            <Progress value={value} max={max} className="h-2" />
        </div>
    );
}
