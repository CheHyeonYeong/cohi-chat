import { forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant: "primary" | "secondary" | "outline";
    className?: string;
    children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant, className, children, ...props }, ref) => {
        const variantStyles = {
            primary: "border border-gray-200 bg-blue-500 text-white",
            secondary: "border border-gray-200 bg-gray-200 text-gray-800",
            outline: "cohe-btn-outline",
        }[variant];

        return (
            <button
                ref={ref}
                className={clsx("rounded-md", variantStyles, className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
