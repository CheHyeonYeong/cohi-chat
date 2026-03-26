import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "~/libs/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "selectable";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant: ButtonVariant;
    size?: "sm" | "md" | "lg";
    selected?: boolean;
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

const variantStyles: Record<ButtonVariant, string> = {
    primary: "cohi-btn-primary",
    secondary: "cohi-btn-secondary",
    outline: "cohi-btn-outline",
    selectable: "cohi-selectable",
};

const selectedStyles: Partial<Record<ButtonVariant, string>> = {
    selectable: "cohi-selectable-active",
};

export const Button = ({ variant, size = "md", selected = false, loading = false, asChild = false, disabled, className, children, ref, ...props }: ButtonProps) => {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            ref={ref}
            {...(!asChild && { type: "button" as const })}
            disabled={loading || disabled}
            aria-pressed={selected || undefined}
            className={cn(
                "rounded-md disabled:opacity-50 disabled:cursor-not-allowed",
                selected && selectedStyles[variant] ? selectedStyles[variant] : variantStyles[variant],
                sizeStyles[size],
                className,
            )}
            {...props}
        >
            {children}
        </Comp>
    );
};
