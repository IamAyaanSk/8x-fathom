import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { LEGAL_CONTACT_EMAIL, PRODUCT_NAME } from '#lib/legal-meta'

type LegalLayoutProps = {
  children: ReactNode
  title: string
}

function LegalLayout({ children, title }: LegalLayoutProps) {
  return (
    <div className="dark bg-background text-foreground min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-10">
        <header className="border-border flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/login"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            {PRODUCT_NAME}
            <span
              aria-hidden="true"
              className="bg-primary inline-block size-2.5 rounded-sm"
            />
          </Link>
          <nav
            aria-label="Legal"
            className="text-muted-foreground flex flex-wrap gap-4 text-sm"
          >
            <Link
              to="/privacy"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
          </nav>
        </header>
        <main className="flex-1 py-10">
          <h1 className="mb-8 text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <div className="text-muted-foreground [&_h2]:text-foreground [&_h3]:text-foreground flex flex-col gap-8 text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-sm [&_h3]:font-medium [&_li]:ml-5 [&_li]:list-disc [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-0 [&_p]:max-w-none [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-0">
            {children}
          </div>
        </main>
        <footer className="border-border text-muted-foreground border-t pt-6 text-xs">
          <p>
            Questions?{' '}
            <a
              className="text-foreground underline-offset-4 hover:underline"
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            >
              Contact us
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  )
}

export { LegalLayout }
