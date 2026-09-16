import type { MeetingShareDetail } from '@repo/api-client/v1/share/index'
import { meetingParticipantLabel } from '@repo/api-contract/meeting-participants'
import { cn } from '@repo/ui-web/lib/utils'
import { Check, Sparkles } from 'lucide-react'

import { MeetingTimestampLink } from '#components/meetings/meeting-timestamp-link'
import { formatMeetingDetailDate } from '#lib/format-meeting-detail-date'

type MeetingShareSidebarProps = {
  meeting: MeetingShareDetail
  onSeek: (timestampSec: number) => void
  className?: string
}

function MeetingShareSidebar({
  meeting,
  onSeek,
  className
}: MeetingShareSidebarProps) {
  const title =
    meeting.title.trim().length > 0 ? meeting.title : 'Untitled call'
  const dateLabel = formatMeetingDetailDate(meeting.startTime)

  return (
    <aside className={cn('flex flex-col gap-0', className)}>
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className="text-foreground truncate text-lg leading-snug font-semibold">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{dateLabel}</p>
        </div>
      </div>

      <section className="border-border flex flex-col gap-3 border-t py-8">
        <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          Attendees
        </h2>
        {meeting.participants.length === 0 ? (
          <p className="text-muted-foreground text-sm">No attendees listed.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {meeting.participants.map((participant) => {
              const label = meetingParticipantLabel(participant)
              return (
                <li
                  key={participant.id}
                  className="flex items-center gap-3 rounded-lg"
                >
                  {participant.profilePicture ? (
                    <img
                      src={participant.profilePicture}
                      className="border-border size-10 rounded-full border object-cover"
                    />
                  ) : (
                    <span
                      className="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-full text-xs font-semibold"
                      aria-hidden
                    >
                      {label.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="text-foreground min-w-0 truncate text-sm font-medium">
                    {label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="border-border flex flex-col gap-4 border-t py-8">
        <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          Action items
        </h2>
        {meeting.actionItems.length === 0 ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            No action items for this call.
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-5">
              {meeting.actionItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 text-sm leading-snug"
                >
                  <span
                    className={cn(
                      'border-border mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                      item.completed &&
                        'border-primary bg-primary text-primary-foreground'
                    )}
                    aria-hidden
                  >
                    {item.completed ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'text-foreground/90 block',
                        item.completed && 'text-muted-foreground line-through'
                      )}
                    >
                      {item.text}
                    </span>
                    {item.timestampSec !== null ? (
                      <div className="mt-1.5 flex items-center gap-1">
                        <Sparkles
                          aria-hidden
                          className="text-chart-4 size-3 shrink-0"
                        />
                        <MeetingTimestampLink
                          timestampSec={item.timestampSec}
                          onSeek={onSeek}
                          className="text-primary text-xs font-medium tabular-nums hover:underline"
                        />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Sparkles aria-hidden className="text-chart-4 size-3.5" />
              Action items generated by AI
            </p>
          </>
        )}
      </section>
    </aside>
  )
}

export { MeetingShareSidebar }
