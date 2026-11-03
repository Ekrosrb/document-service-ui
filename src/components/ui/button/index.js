import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-none border border-transparent font-heading text-sm font-extrabold leading-tight [&_svg:not([class*=size-])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:block",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-accent-600 active:bg-accent-700",
        outline: "border-border hover:bg-foreground/7 active:bg-foreground/14",
        secondary: "border-border hover:bg-foreground/7 active:bg-foreground/14",
        ghost: "text-primary hover:bg-primary/10 active:bg-primary/18",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        "destructive-outline": "border-destructive/60 text-destructive hover:border-destructive hover:bg-destructive/10 active:bg-destructive/18",
        "destructive-ghost": "text-destructive hover:bg-destructive/10 active:bg-destructive/18",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3.5",
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*=size-])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-[13px] [&_svg:not([class*=size-])]:size-3.5",
        lg: "h-10 gap-2 px-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*=size-])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*=size-])]:size-3.5",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
