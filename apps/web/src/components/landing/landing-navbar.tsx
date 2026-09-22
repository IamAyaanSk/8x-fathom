import { Button, buttonVariants } from '@repo/ui-web/components/button'
import { cn } from '@repo/ui-web/lib/utils'
import { Link } from '@tanstack/react-router'
import { Menu, Waves, X } from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Showcase', href: '#showcase' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Capabilities', href: '#capabilities' }
] as const

interface LandingNavbarProps {
  isAuthenticated?: boolean
}

function LandingNavbar({ isAuthenticated }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-border/40 bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <Waves
            aria-hidden
            className="text-primary size-5"
            strokeWidth={2.25}
          />
          <span className="text-foreground text-sm font-semibold tracking-[0.2em]">
            8X FATHOM
          </span>
        </Link>

        <nav
          aria-label="Main Navigation"
          className="hidden items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {isAuthenticated ? (
            <Link
              to="/meetings"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_18px_-3px_rgba(56,189,248,0.35)] font-semibold px-4 transition-all'
              )}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'text-muted-foreground hover:text-foreground text-sm'
                )}
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ size: 'sm' }),
                  'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_18px_-3px_rgba(56,189,248,0.35)] font-semibold px-4 transition-all'
                )}
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated ? (
            <Link
              to="/meetings"
              className={cn(
                buttonVariants({ size: 'xs' }),
                'bg-primary text-primary-foreground font-semibold'
              )}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className={cn(
                buttonVariants({ size: 'xs' }),
                'bg-primary text-primary-foreground font-semibold'
              )}
            >
              Get started
            </Link>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen)
            }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-border/60 bg-background/95 border-b px-4 py-4 backdrop-blur-2xl md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => {
                  setMobileMenuOpen(false)
                }}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-border/60 my-2 border-t pt-3">
              {isAuthenticated ? (
                <Link
                  to="/meetings"
                  onClick={() => {
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    buttonVariants({ size: 'default' }),
                    'bg-primary text-primary-foreground hover:bg-primary/90 w-full justify-center font-semibold'
                  )}
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => {
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-full justify-center'
                    )}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => {
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      buttonVariants({ variant: 'default' }),
                      'bg-primary text-primary-foreground hover:bg-primary/90 w-full justify-center font-semibold'
                    )}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

export { LandingNavbar }
