import type { HTMLAttributes, Ref } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "~/libs/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "elevated" | "prominent";
    size?: "sm" | "md" | "lg";
    asChild?: boolean;
    noBackground?: boolean;
    noShadow?: boolean;
    title?: string;
    ref?: Ref<HTMLDivElement>;
}

const variantStyles = {
    default: "shadow-sm",
    elevated: "shadow-md",
    prominent: "shadow-lg",
};

const sizeStyles = {
    sm: "p-5",
    md: "p-6",
    lg: "p-8",
};

export const Card = ({ variant = "default", size = "md", asChild = false, noBackground = false, noShadow = false, title, className, children, ref, ...props }: CardProps) => {
    const cardClassName = cn(
        "rounded-2xl",
        !noBackground && "bg-white",
        !noShadow && variantStyles[variant],
        sizeStyles[size],
        className,
    );

    if (asChild) {
        return (
            <Slot ref={ref} className={cardClassName} {...props}>
                {children}
            </Slot>
        );
    }

    return (
        <div ref={ref} className={cardClassName} {...props}>
            {title && (
                <h3 className="font-semibold text-lg text-cohi-text-dark mb-4">{title}</h3>
            )}
            {children}
        </div>
    );
};
