import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

interface ToggleGroupContextValue extends VariantProps<typeof toggleVariants> {
    spacing?:     number
    orientation?: "horizontal" | "vertical"
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
    size:        "default",
    variant:     "default",
    spacing:     0,
    orientation: "horizontal",
})

function ToggleGroup({
    className,
    variant,
    size,
    spacing = 0,
    orientation = "horizontal",
    children,
    ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants> & {
        spacing?:     number
        orientation?: "horizontal" | "vertical"
    }) {
    const isVertical = orientation === "vertical"

    return (
        <ToggleGroupPrimitive.Root
            data-slot="toggle-group"
            data-variant={variant}
            data-size={size}
            data-orientation={orientation}
            style={{
                gap:           spacing ? `${(spacing as number) * 0.25}rem` : undefined,
                flexDirection: isVertical ? "column" : "row",
                alignItems:    isVertical ? "stretch" : "center",
            }}
            className={cn(
                "flex w-fit rounded-lg",
                className,
            )}
            {...props}
        >
            <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation }}>
                {children}
            </ToggleGroupContext.Provider>
        </ToggleGroupPrimitive.Root>
    )
}

function ToggleGroupItem({
    className,
    children,
    variant = "default",
    size    = "default",
    ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>) {
    const context    = React.useContext(ToggleGroupContext)
    const noSpacing  = !context.spacing
    const isVertical = context.orientation === "vertical"

    return (
        <ToggleGroupPrimitive.Item
            data-slot="toggle-group-item"
            data-variant={context.variant || variant}
            data-size={context.size || size}
            className={cn(
                "shrink-0 focus:z-10 focus-visible:z-10",
                // When spacing=0 items are joined — remove individual rounding
                noSpacing && "rounded-none px-2",
                // First item rounded start
                noSpacing && !isVertical && "first:rounded-l-lg",
                noSpacing &&  isVertical && "first:rounded-t-lg",
                // Last item rounded end
                noSpacing && !isVertical && "last:rounded-r-lg",
                noSpacing &&  isVertical && "last:rounded-b-lg",
                toggleVariants({
                    variant: context.variant || variant,
                    size:    context.size    || size,
                }),
                className,
            )}
            {...props}
        >
            {children}
        </ToggleGroupPrimitive.Item>
    )
}

export { ToggleGroup, ToggleGroupItem }