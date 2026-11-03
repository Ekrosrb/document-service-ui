import { cva } from "class-variance-authority";

export { default as Badge } from "./Badge.vue";

export const badgeVariants = cva(
  "gap-1 rounded-none border border-transparent px-2.5 py-[3px] text-[11px] leading-tight tracking-[0.02em] [&>svg]:size-3! group/badge inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        accent: "bg-accent-100 text-accent-800",
        secondary: "bg-neutral-100 text-neutral-800",
        neutral: "bg-neutral-100 text-neutral-800",
        destructive: "border-destructive text-destructive",
        outline: "border-primary text-primary",
        ghost: "text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
