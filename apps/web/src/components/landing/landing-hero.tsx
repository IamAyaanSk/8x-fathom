import { buttonVariants } from '@repo/ui-web/components/button'
import { cn } from '@repo/ui-web/lib/utils'
import { Link } from '@tanstack/react-router'

import { GoogleMark } from '#components/auth/google-mark'
interface LandingHeroProps {
  isAuthenticated?: boolean
}

function LandingHero({ isAuthenticated }: LandingHeroProps) {
  return (
    <section className="relative flex min-h-[90dvh] w-full items-center justify-center overflow-hidden sm:min-h-[80dvh]">
      <div className="absolute inset-0 z-0 select-none">
        <img
          src="/hero.webp"
          alt="Scenic sunrise workspace with video call"
          className="size-full object-cover object-[center_35%]"
          loading="eager"
        />

        <div className="from-background/40 to-background/40 pointer-events-none absolute inset-0 bg-linear-to-r via-transparent via-15% via-85%" />

        <div className="from-background/80 via-background/20 pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b to-transparent" />

        <div className="from-background via-background/70 pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t via-35% to-transparent sm:h-64" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 pt-40 pb-56 text-center sm:px-6 sm:pt-48 sm:pb-72 lg:px-8 lg:pt-52 lg:pb-80">
        <div className="border-border/50 bg-background/60 mb-8 inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 shadow-sm backdrop-blur-md">
          <span className="bg-primary size-1.5 animate-pulse rounded-full" />
          <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            Autonomous Meeting Intelligence
          </span>
        </div>

        <h1 className="text-3xl leading-[1.12] font-semibold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.75)] sm:text-5xl md:text-6xl">
          Never take meeting notes again.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed font-normal text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.75)] sm:text-lg">
          8x Fathom auto-joins your Google Meet calls, writes accurate summaries
          with timestamped action items, and lets you query your meeting
          history.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/meetings"
              className={cn(
                buttonVariants({ size: 'default' }),
                'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_28px_-4px_rgba(56,189,248,0.5)] hover:shadow-[0_0_36px_-2px_rgba(56,189,248,0.65)] font-semibold px-8 h-12 rounded-xl transition-all'
              )}
            >
              Go to your dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className={cn(
                buttonVariants({ size: 'default' }),
                'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_28px_-4px_rgba(56,189,248,0.5)] hover:shadow-[0_0_36px_-2px_rgba(56,189,248,0.65)] flex items-center gap-2.5 font-semibold px-8 h-12 rounded-xl transition-all'
              )}
            >
              <GoogleMark />
              Start free with Google
            </Link>
          )}

          <a
            href="#showcase"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'default' }),
              'border-border/60 bg-background/50 hover:bg-muted/50 text-white hover:text-white px-7 h-12 rounded-xl backdrop-blur-md transition-all'
            )}
          >
            See product showcase
          </a>
        </div>
      </div>

      <div className="via-border/50 absolute inset-x-0 bottom-0 z-10 h-px bg-linear-to-r from-transparent to-transparent" />
      <div className="via-primary/30 absolute bottom-0 left-1/2 z-10 h-px w-64 -translate-x-1/2 bg-linear-to-r from-transparent to-transparent" />
    </section>
  )
}

export { LandingHero }
