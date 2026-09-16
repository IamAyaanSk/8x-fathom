import { Heart } from 'lucide-react'

function MadeWithLoveByAyaan() {
  return (
    <p className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
      Made with
      <Heart
        aria-hidden
        className="text-destructive size-3 fill-current"
        strokeWidth={0}
      />
      by{' '}
      <a
        href="https://ayaan.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline-offset-4 hover:underline"
      >
        Ayaan
      </a>
    </p>
  )
}

export { MadeWithLoveByAyaan }
