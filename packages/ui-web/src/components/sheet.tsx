import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { XIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '#components/button'

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className
      )}
      {...props}
    />
  )
}

const sheetContentVariants = cva(
  'fixed z-50 flex flex-col bg-popover text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none dark:ring-foreground/10 data-open:animate-in data-closed:animate-out',
  {
    variants: {
      side: {
        right:
          'inset-y-0 right-0 h-dvh w-full max-w-[min(100%,32rem)] border-l data-open:slide-in-from-right data-closed:slide-out-to-right data-closed:fade-out-0 data-open:fade-in-0',
        left: 'inset-y-0 left-0 h-dvh w-full max-w-[min(100%,32rem)] border-r data-open:slide-in-from-left data-closed:slide-out-to-left data-closed:fade-out-0 data-open:fade-in-0',
        top: 'inset-x-0 top-0 max-h-[85dvh] border-b data-open:slide-in-from-top data-closed:slide-out-to-top',
        bottom:
          'inset-x-0 bottom-0 max-h-[85dvh] border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom'
      }
    },
    defaultVariants: {
      side: 'right'
    }
  }
)

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props &
  VariantProps<typeof sheetContentVariants> & {
    showCloseButton?: boolean
  }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(sheetContentVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="bg-secondary absolute top-4 right-4"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 pr-12', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        'font-heading text-base leading-none font-medium',
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className
      )}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger
}
