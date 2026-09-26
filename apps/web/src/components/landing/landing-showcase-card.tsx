import { useState } from 'react'

interface FeaturePillar {
  id: string
  name: string
  headline: string
  description: string
  image: string
  imageAlt: string
  url: string
  points: Array<{
    title: string
    detail: string
  }>
}

const FEATURE_PILLARS: FeaturePillar[] = [
  {
    id: 'summary',
    name: 'Summary & Action Items',
    headline: 'Unforgettable meetings, delivered in seconds',
    description:
      'Structured recaps with overview, key takeaways, and timestamped action items generated immediately after your call ends.',
    image: '/call-summary.png',
    imageAlt: 'AI meeting summary and action items in 8x Fathom',
    url: 'app.8xfathom.video/meetings/daily-standup#summary',
    points: [
      {
        title: 'Executive recap',
        detail:
          'Comprehensive overview and discussion highlights ready for team review.'
      },
      {
        title: 'Action items',
        detail:
          'Clear assignments linked directly to the recording timestamp where they were discussed.'
      },
      {
        title: 'One-click email',
        detail:
          'Pre-formatted follow-up notes ready to copy and send to attendees immediately.'
      }
    ]
  },
  {
    id: 'ai',
    name: 'Ask Fathom AI',
    headline: 'Query your entire meeting library with AI',
    description:
      'Ask questions across your past calls. 8x Fathom searches transcript history to provide exact answers with source citations.',
    image: '/ask-fathom.png',
    imageAlt: 'Ask Fathom AI answering questions across past meetings',
    url: 'app.8xfathom.video/meetings/daily-standup#ask-fathom',
    points: [
      {
        title: 'Natural language search',
        detail:
          'Ask specific questions like "What was the final decision on the project deadline?"'
      },
      {
        title: 'Verified citations',
        detail:
          'Responses reference the exact meeting timestamp and speaker for transparency.'
      },
      {
        title: 'Multi-call recall',
        detail:
          'Synthesizes information across your entire workspace, not just the latest call.'
      }
    ]
  },
  {
    id: 'transcript',
    name: 'Synced Transcript',
    headline: 'Word-for-word playback with speaker detection',
    description:
      'Accurate transcription synchronized directly with audio and video. Jump to any moment in the recording by clicking text.',
    image: '/call-transcript.png',
    imageAlt: 'Synced transcript view with video playback in 8x Fathom',
    url: 'app.8xfathom.video/meetings/daily-standup#transcript',
    points: [
      {
        title: 'Speaker identification',
        detail:
          'Separates voices accurately across team members and external clients.'
      },
      {
        title: 'Click-to-seek',
        detail:
          'Click any transcript phrase to immediately jump the video player to that time.'
      },
      {
        title: 'Playback controls',
        detail:
          'Variable playback speeds and full video scrubbing with visual markers.'
      }
    ]
  },
  {
    id: 'highlights',
    name: 'Highlights & Scratchpad',
    headline: 'Bookmark key moments while the call is happening',
    description:
      'Stay present in the meeting without scrambling for notes. Mark highlights with real-time waveform tracking and take scratchpad notes.',
    image: '/call-highlight.png',
    imageAlt: 'Live call highlight waveform and scratchpad interface',
    url: 'app.8xfathom.video/meetings/daily-standup?tab=ongoing',
    points: [
      {
        title: 'Instant highlights',
        detail:
          'One click bookmarks the ongoing conversation with visual audio waveform tracking.'
      },
      {
        title: 'Synced scratchpad',
        detail:
          'Jot notes anchored automatically to the current second of the conversation.'
      },
      {
        title: 'Live status',
        detail:
          'Real-time feedback as the bot joins, records, and initiates transcription.'
      }
    ]
  },
  {
    id: 'calendar',
    name: 'Upcoming Calls',
    headline: 'Autonomous bot dispatch from your calendar',
    description:
      'Connect Google Calendar once. Autonomous notetaker bots dispatch automatically 1–2 minutes before your scheduled meetings start.',
    image: '/list-calls.png',
    imageAlt: '8x Fathom dashboard showing upcoming and processed meetings',
    url: 'app.8xfathom.video/meetings',
    points: [
      {
        title: 'Zero manual joining',
        detail:
          'No bot invitations or link pasting required. Dispatch runs entirely on schedule.'
      },
      {
        title: 'Google Meet integration',
        detail:
          'Works reliably across your scheduled Google Meet calendar events.'
      },
      {
        title: 'Central library',
        detail:
          'A unified view of upcoming calls, live recordings, and completed meetings.'
      }
    ]
  }
]

function LandingShowcaseCard() {
  const [activeId, setActiveId] = useState<string>('summary')

  const activePillar =
    FEATURE_PILLARS.find((p) => p.id === activeId) ?? FEATURE_PILLARS[0]!

  return (
    <section
      id="showcase"
      className="mx-auto mb-32 w-full max-w-6xl px-4 pt-32 pb-0 sm:mb-40 sm:px-6 sm:pt-40 sm:pb-0 lg:px-8"
    >
      <div className="mb-14 max-w-2xl sm:mb-16">
        <span className="text-primary font-mono text-xs tracking-widest uppercase">
          Product Experience
        </span>
        <h2 className="text-foreground mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Designed for clarity. Built for speed.
        </h2>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          From the first minute of your call to post-meeting follow-ups, 8x
          Fathom keeps your team aligned without manual administrative work.
        </p>
      </div>

      <div className="border-border/60 bg-muted/60 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border p-1.5 backdrop-blur-md">
        {FEATURE_PILLARS.map((pillar) => {
          const isActive = pillar.id === activePillar.id
          return (
            <button
              key={pillar.id}
              type="button"
              onClick={() => {
                setActiveId(pillar.id)
              }}
              className={`rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap transition-all sm:text-sm ${
                isActive
                  ? 'border-border/70 text-foreground bg-card border font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {pillar.name}
            </button>
          )
        })}
      </div>

      <div className="mt-10 sm:mt-12">
        <div className="border-border/70 bg-card relative rounded-2xl border p-1.5 shadow-xl ring-1 ring-border/50">
          <div className="border-border/40 bg-card overflow-hidden rounded-xl border">
            <div className="border-border/40 bg-muted/40 flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
                <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
                <span className="bg-muted-foreground/30 size-2.5 rounded-full" />
              </div>
              <div className="border-border/40 text-muted-foreground bg-background rounded-md border px-3 py-1 font-mono text-xs">
                {activePillar.url}
              </div>
              <div className="w-8" />
            </div>

            <div className="bg-muted/20 relative overflow-hidden">
              <img
                src={activePillar.image}
                alt={activePillar.imageAlt}
                className="w-full object-cover transition-opacity duration-300 select-none"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="border-border/40 divide-border/40 mt-16 grid grid-cols-1 divide-y border-y py-10 sm:mt-20 sm:py-12 md:grid-cols-3 md:divide-x md:divide-y-0">
          {activePillar.points.map((point, index) => (
            <div
              key={point.title}
              className="flex flex-col px-0 py-6 first:pt-0 last:pb-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0"
            >
              <span className="text-primary/80 mb-2.5 font-mono text-xs font-semibold">
                0{index + 1}
              </span>
              <h3 className="text-foreground text-sm font-semibold tracking-tight">
                {point.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {point.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { LandingShowcaseCard }
