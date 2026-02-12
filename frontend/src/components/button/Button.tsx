import { forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    className?: string;
    children: React.ReactNode;
}

const sizeStyles = {
    sm: "px-4 py-2 text-sm font-medium",
    md: "px-4 py-2 font-medium",
    lg: "px-6 py-3 font-semibold",
};

const variantStyles = {
    primary: "cohe-btn-primary",
    secondary: "cohe-btn-secondary",
    outline: "cohe-btn-outline",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant, size = "md", className, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={clsx("rounded-lg", variantStyles[variant], sizeStyles[size], className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
