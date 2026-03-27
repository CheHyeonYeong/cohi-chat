import type { AnchorHTMLAttributes, ReactNode, Ref } from "react";
import { createLink } from "@tanstack/react-router";
import { Button } from "./Button";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    variant: "primary" | "secondary" | "outline";
    size?: "md" | "lg";
    className?: string;
    children: ReactNode;
    ref?: Ref<HTMLAnchorElement>;
}

const LinkButtonInner = ({ variant, size, className, children, ref, ...anchorProps }: LinkButtonProps) => <Button variant={variant} size={size} className={className} asChild>
    <a ref={ref} {...anchorProps}>{children}</a>
</Button>;

export const LinkButton = createLink(LinkButtonInner);
