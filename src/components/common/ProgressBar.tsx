import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface ProgressBarProps {
    label?: string;
    value: number;
    max?: number;
    showValue?: boolean;
    className?: string;
}

export function ProgressBar({ label, value, max = 100, showValue = false, className }: ProgressBarProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex justify-between items-end text-xs font-black uppercase tracking-widest">
                {label && <Label className="text-muted-foreground">{label}</Label>}
                {showValue && <span className="text-primary">{value}%</span>}
            </div>
            <Progress value={value} max={max} className="h-2.5 bg-muted/40" />
        </div>
    );
}
