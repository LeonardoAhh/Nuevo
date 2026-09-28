import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/**
 * Shared horizontal frame for every authenticated workspace surface.
 * Keeping header and page content on the same grid prevents routes from
 * inventing their own gutters or stretching beyond a readable line length.
 */
export function WorkspaceContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    />
  )
}
