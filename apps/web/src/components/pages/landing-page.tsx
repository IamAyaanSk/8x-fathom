import { LandingFeatures } from '#components/landing/landing-features'
import { LandingFooter } from '#components/landing/landing-footer'
import { LandingHero } from '#components/landing/landing-hero'
import { LandingNavbar } from '#components/landing/landing-navbar'
import { LandingShowcaseCard } from '#components/landing/landing-showcase-card'
import { authClient } from '#lib/auth-client'

function LandingPage() {
  const { data: session } = authClient.useSession()
  const isAuthenticated = Boolean(session?.user)

  return (
    <div className="bg-background text-foreground selection:bg-primary/30 selection:text-primary flex min-h-dvh flex-col">
      <LandingNavbar isAuthenticated={isAuthenticated} />
      <main className="flex-1">
        <LandingHero isAuthenticated={isAuthenticated} />
        <LandingShowcaseCard />
        <LandingFeatures isAuthenticated={isAuthenticated} />
      </main>
      <LandingFooter />
    </div>
  )
}

export { LandingPage }
