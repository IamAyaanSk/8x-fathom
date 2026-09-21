import { Waves } from 'lucide-react'

function RootPending() {
  return (
    <div className="dark bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="bg-card ring-border relative flex size-14 items-center justify-center rounded-2xl shadow-lg ring-1">
        <Waves
          aria-hidden
          className="text-primary size-7 animate-pulse"
          strokeWidth={2.25}
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          8X FATHOM
        </span>
      </div>
    </div>
  )
}

export { RootPending }
