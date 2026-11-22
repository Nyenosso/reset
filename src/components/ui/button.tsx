import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-strong active:bg-accent-strong",
        secondary: "bg-surface text-ink border border-line hover:bg-subtle active:bg-subtle",
        ghost: "text-ink hover:bg-subtle active:bg-subtle",
        quiet: "text-muted hover:text-ink hover:bg-subtle",
        danger: "bg-danger text-white hover:opacity-90",
        dangerGhost: "text-danger hover:bg-danger-soft",
        soft: "bg-accent-soft text-accent-strong hover:bg-[#f7dfd0]",
      },
      size: {
        sm: "h-9 px-3 text-sm [&_svg]:size-4",
        md: "h-11 px-4 text-[15px] [&_svg]:size-[18px]",
        lg: "h-12 px-5 text-base [&_svg]:size-5",
        icon: "size-11 [&_svg]:size-5",
        iconSm: "size-9 [&_svg]:size-[18px]",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, asChild, type, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp ref={ref} type={asChild ? undefined : (type ?? "button")} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

export { buttonVariants };
