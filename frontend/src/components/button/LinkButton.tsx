import { forwardRef } from "react";
import { createLink } from "@tanstack/react-router";
import Button from "./Button";

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    variant: "primary" | "secondary" | "outline";
    size?: "md" | "lg";
    className?: string;
    children: React.ReactNode;
}

const LinkButtonInner = forwardRef<HTMLAnchorElement, LinkButtonProps>(
    ({ variant, size, className, children, ...anchorProps }, ref) => {
        return (
            <Button variant={variant} size={size} className={className} asChild>
                <a ref={ref} {...anchorProps}>{children}</a>
            </Button>
        );
    }
);

LinkButtonInner.displayName = "LinkButtonInner";

const LinkButton = createLink(LinkButtonInner);

export default LinkButton;
