import { cn } from "@/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
        className={cn("animate-pulse rounded-lg bg-primary/10", className)}
      {...props} />
  );
}

export { Skeleton }
