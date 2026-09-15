import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import type { ReactElement, ReactNode } from 'react'

import { cn } from '#lib/utils'

function TooltipProvider({
  delay = 200,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />
}

type TooltipProps = {
  content: ReactNode
  children: ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
}

function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={children} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side={side} sideOffset={6}>
          <TooltipPrimitive.Popup
            className={cn(
              'bg-popover text-popover-foreground ring-border z-50 max-w-xs rounded-lg px-3 py-2 text-xs leading-relaxed shadow-md ring-1'
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export { Tooltip, TooltipProvider }
