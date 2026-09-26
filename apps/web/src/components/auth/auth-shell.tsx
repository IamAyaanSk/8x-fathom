import type { ReactNode } from 'react'

import { MadeWithLoveByAyaan } from '#components/layout/made-with-love-by-ayaan'

type AuthShellProps = {
  children: ReactNode
}

function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="bg-background text-foreground min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-10">
        <header className="flex justify-center">
          <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            8x Fathom
            <span
              aria-hidden="true"
              className="bg-primary inline-block size-2.5 rounded-sm"
            />
          </p>
        </header>
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2">
            {children}
            <blockquote className="relative hidden max-w-lg lg:block">
              <span
                aria-hidden="true"
                className="text-muted-foreground/30 pointer-events-none absolute -top-10 -left-4 font-serif text-7xl"
              >
                “
              </span>
              <p className="text-2xl leading-snug font-medium">
                Meetings happen once.{' '}
                <span className="text-primary">8x Fathom</span> keeps the notes,
                highlights, and action items.
              </p>
              <footer className="text-muted-foreground mt-6 text-sm">
                Product slice
                <br />
                AI meeting notetaker
              </footer>
              <span
                aria-hidden="true"
                className="text-muted-foreground/30 pointer-events-none absolute -right-2 -bottom-8 font-serif text-7xl"
              >
                ”
              </span>
            </blockquote>
          </div>
        </main>
        <footer className="pt-4 pb-2">
          <MadeWithLoveByAyaan />
        </footer>
      </div>
    </div>
  )
}

export { AuthShell }
