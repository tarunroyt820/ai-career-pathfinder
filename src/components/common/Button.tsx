import { Button as ShadedButton } from "@/components/ui/button";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    children: React.ReactNode;
}

export function Button({ children, ...props }: ButtonProps) {
    return (
        <ShadedButton {...props}>
            {children}
        </ShadedButton>
    );
}
