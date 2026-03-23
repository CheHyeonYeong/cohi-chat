import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "~/libs/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    asChild?: boolean;
    className?: string;
    children: ReactNode;
    ref?: Ref<HTMLButtonElement>;
}

const sizeStyles = {
    sm: "px-3 py-1.5 text-sm font-medium",
    md: "px-4 py-2 text-base font-medium",
    lg: "px-6 py-3 text-lg font-semibold",
};

const variantStyles = {
    primary: "cohi-btn-primary",
    secondary: "cohi-btn-secondary",
    outline: "cohi-btn-outline",
};

export const Button = ({ variant, size = "md", loading = false, asChild = false, disabled, className, children, ref, ...props }: ButtonProps) => {
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
};
