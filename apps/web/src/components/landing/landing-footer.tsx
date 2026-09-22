import { Link } from '@tanstack/react-router'
import { Heart, Waves } from 'lucide-react'

function LandingFooter() {
  return (
    <footer className="border-border/50 bg-background/80 relative mt-14 border-t sm:mt-20">
      <div className="via-primary/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link to="/" className="flex items-center gap-2.5">
              <Waves className="text-primary size-5" strokeWidth={2.25} />
              <span className="text-foreground text-sm font-semibold tracking-[0.2em]">
                8X FATHOM
              </span>
            </Link>
            <p className="text-muted-foreground text-xs">
              Autonomous meeting intelligence for Google Meet.
            </p>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-8 text-xs">
            <a
              href="#showcase"
              className="hover:text-foreground transition-colors"
            >
              Showcase
            </a>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#capabilities"
              className="hover:text-foreground transition-colors"
            >
              Capabilities
            </a>
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="border-border/40 text-muted-foreground mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} 8x Fathom. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart className="size-3.5 fill-red-500 text-red-500" />{' '}
            by <span className="text-foreground font-medium">Ayaan</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export { LandingFooter }
