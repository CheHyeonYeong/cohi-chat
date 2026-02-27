import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "~/libs/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    asChild?: boolean;
    className?: string;
    children: React.ReactNode;
}

const sizeStyles = {
    sm: "px-3 py-1.5 text-sm font-medium",
    md: "px-4 py-2 text-base font-medium",
    lg: "px-6 py-3 text-lg font-semibold",
};

const variantStyles = {
    primary: "cohe-btn-primary",
    secondary: "cohe-btn-secondary",
    outline: "cohe-btn-outline",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant, size = "md", loading = false, asChild = false, disabled, className, children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                ref={ref}
                {...(!asChild && { type: "button" as const })}
                disabled={loading || disabled}
                className={cn(
                    "rounded-md disabled:opacity-50 disabled:cursor-not-allowed",
                    variantStyles[variant],
                    sizeStyles[size],
                    className,
                )}
                {...props}
            >
                {children}
            </Comp>
        );
    }
);

Button.displayName = 'Button';

export default Button;
