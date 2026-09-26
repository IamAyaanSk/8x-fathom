import { buttonVariants } from '@repo/ui-web/components/button'
import { cn } from '@repo/ui-web/lib/utils'
import { Link } from '@tanstack/react-router'

import { GoogleMark } from '#components/auth/google-mark'

const WORKFLOW = [
  {
    step: '01',
    heading: 'Connect your calendar',
    description:
      'Authorize Google Calendar in one click with read-only event access. 8x Fathom watches upcoming Google Meet calls with zero manual configuration.'
  },
  {
    step: '02',
    heading: 'Autonomous bot dispatch',
    description:
      'A dedicated meeting bot joins 1-2 minutes before your call begins. You never have to copy meeting links, remember to invite bots, or press start manually.'
  },
  {
    step: '03',
    heading: 'Immediate intelligence',
    description:
      'As soon as the meeting ends, notes and recordings are encrypted and ready in seconds. Executive summaries, action items, and speaker-attributed transcripts are available immediately.'
  }
] as const

const CAPABILITIES = [
  {
    title: 'Ask Fathom AI',
    description:
      'Query your entire meeting library with natural language. Ask Fathom uses intelligent semantic search to provide exact answers with speaker citations and timestamps.'
  },
  {
    title: 'Synced video & audio playback',
    description:
      'Review recordings with full transcript synchronization. Click any sentence to instantly seek the video to that moment in the conversation.'
  },
  {
    title: 'Highlights & scratchpad',
    description:
      'Stay present during active Google Meet calls. Mark key highlights with audio waveforms and write timestamped scratchpad notes that sync with the final recording.'
  },
  {
    title: 'One-click follow-up emails',
    description:
      'Copy a clean, formatted executive summary and action item checklist to send to participants immediately following the meeting.'
  },
  {
    title: 'Speaker identification',
    description:
      'Accurately distinguishes between different meeting attendees so notes and transcript snippets always attribute who said what.'
  },
  {
    title: 'Secure encrypted cloud storage',
    description:
      'Audio, video, and transcript records are stored with end-to-end security and private signed links for controlled playback.'
  }
] as const

interface LandingFeaturesProps {
  isAuthenticated?: boolean
}

function LandingFeatures({ isAuthenticated }: LandingFeaturesProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-0 sm:px-6 sm:py-0 lg:px-8">
      <section id="how-it-works" className="mb-32 sm:mb-40">
        <div className="mb-14 max-w-2xl sm:mb-16">
          <span className="text-primary font-mono text-xs tracking-widest uppercase">
            Lifecycle Workflow
          </span>
          <h2 className="text-foreground mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Autonomous from start to finish
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            No buttons to remember. No links to paste. 8x Fathom manages the
            full capture and synthesis lifecycle automatically.
          </p>
        </div>

        <div className="border-border/50 divide-border/40 bg-card/60 grid grid-cols-1 divide-y overflow-hidden rounded-2xl border shadow-xl backdrop-blur-sm md:grid-cols-3 md:divide-x md:divide-y-0">
          {WORKFLOW.map((item) => (
            <div
              key={item.step}
              className="flex flex-col justify-between p-8 transition-colors hover:bg-muted/30 sm:p-10"
            >
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-primary border-primary/25 bg-primary/10 rounded-md border px-2.5 py-1 font-mono text-xs font-semibold">
                    Step {item.step}
                  </span>
                  <div className="bg-border/60 h-px w-8" />
                </div>
                <h3 className="text-foreground text-base font-semibold tracking-tight">
                  {item.heading}
                </h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="mb-32 sm:mb-40">
        <div className="mb-14 max-w-2xl sm:mb-16">
          <span className="text-primary font-mono text-xs tracking-widest uppercase">
            Platform Capabilities
          </span>
          <h2 className="text-foreground mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Engineered for deep focus
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            Everything you need to turn spoken conversations into clear,
            searchable team knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap, index) => (
            <div
              key={cap.title}
              className="border-border/50 hover:border-border bg-card/70 group relative flex flex-col rounded-2xl border p-8 shadow-xs transition-all hover:bg-card"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-muted-foreground/60 font-mono text-xs tracking-wider uppercase">
                  Feature 0{index + 1}
                </span>
                <div className="bg-primary/20 group-hover:bg-primary/50 size-1 rounded-full transition-colors" />
              </div>
              <h3 className="text-foreground text-sm font-semibold tracking-tight">
                {cap.title}
              </h3>
              <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">
                {cap.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-border/50 bg-card/80 relative overflow-hidden rounded-3xl border p-10 text-center shadow-2xl backdrop-blur-md sm:p-16 lg:p-20">
        <div className="from-primary/10 pointer-events-none absolute inset-0 bg-radial-[circle_at_50%_0%] via-transparent to-transparent" />
        <div className="from-border/40 to-border/40 via-primary/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r" />

        <div className="relative z-10 mx-auto max-w-2xl">
          <span className="text-primary font-mono text-xs tracking-widest uppercase">
            Get Started in Seconds
          </span>
          <h2 className="text-foreground mt-4 text-2xl font-semibold tracking-tight sm:text-4xl">
            Turn every meeting into permanent team knowledge.
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed sm:text-lg">
            No bot invitations, no manual notetaking, no transcription delay.
            Fully connected with your Google Calendar.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
          </div>
        </div>
      </section>
    </div>
  )
}

export { LandingFeatures }
