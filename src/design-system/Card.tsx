import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article";
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

export function Card({ as: Tag = "div", padding = "md", className, children, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-border-primary bg-background-primary/30",
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-sm font-semibold text-text-primary", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-xs text-text-muted", className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 border-t border-border-primary pt-4", className)} {...props}>
      {children}
    </div>
  );
}
