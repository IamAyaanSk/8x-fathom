import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { Button } from '#components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '#components/sheet'
import { useIsMobile } from '#hooks/use-mobile'
import { cn } from '#lib/utils'

const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'

type SidebarContextProps = {
  isMobile: boolean
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextProps>({
  isMobile: false,
  openMobile: false,
  setOpenMobile: () => {}
})

function useSidebar(): SidebarContextProps {
  return React.useContext(SidebarContext)
}

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode
}

function Slot({ children, className, ...props }: SlotProps) {
  if (React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)) {
    const childProps = children.props
    return React.cloneElement(children, {
      ...props,
      ...childProps,
      className: cn(className, childProps.className)
    })
  }
  return <>{children}</>
}

type SidebarProviderProps = React.ComponentProps<'div'>

function SidebarProvider({
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      isMobile,
      openMobile,
      setOpenMobile
    }),
    [isMobile, openMobile]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            ...style
          } as React.CSSProperties
        }
        className={cn('flex min-h-dvh w-full bg-background', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

type SidebarProps = React.ComponentProps<'aside'> & {
  side?: 'left' | 'right'
}

function Sidebar({
  side = 'left',
  className,
  children,
  ...props
}: SidebarProps) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground border-sidebar-border w-[var(--sidebar-width)] p-0 [&>button]:hidden"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Sidebar</SheetTitle>
            <SheetDescription>Mobile navigation sidebar</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      data-slot="sidebar"
      className={cn(
        'bg-sidebar text-sidebar-foreground flex h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border select-none sticky top-0 z-20',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'relative flex w-full min-w-0 flex-1 flex-col bg-background min-h-dvh',
        className
      )}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        'flex flex-col gap-2 p-3 border-b border-sidebar-border/60',
        className
      )}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        'flex flex-col gap-2 p-3 mt-auto border-t border-sidebar-border/60',
        className
      )}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('mx-2 my-1 h-px bg-sidebar-border/80', className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2',
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-1.5', className)}
      {...props}
    />
  )
}

type SidebarGroupLabelProps = React.ComponentProps<'div'> & {
  asChild?: boolean
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: SidebarGroupLabelProps) {
  const Comp = asChild ? Slot : 'div'

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'flex h-7 shrink-0 items-center rounded-md px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60',
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn('w-full text-sm', className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn('flex w-full min-w-0 flex-col gap-1', className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn('group/menu-item relative list-none', className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-lg p-2 text-left text-sm font-medium outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'text-sidebar-foreground',
        outline:
          'border border-sidebar-border bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      },
      size: {
        default: 'h-9 text-sm',
        sm: 'h-8 text-xs',
        lg: 'h-11 text-sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

type SidebarMenuButtonProps = React.ComponentProps<'button'> & {
  asChild?: boolean
  isActive?: boolean
} & VariantProps<typeof sidebarMenuButtonVariants>

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Comp>
  )
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'pointer-events-none ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent/80 px-1.5 font-mono text-[11px] font-medium text-sidebar-foreground tabular-nums select-none',
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  useSidebar
}
