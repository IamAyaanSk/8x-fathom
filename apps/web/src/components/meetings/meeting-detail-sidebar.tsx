import { usePatchMeetingActionItemMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import { Tooltip } from '@repo/ui-web/components/tooltip'
import { cn } from '@repo/ui-web/lib/utils'
import {
  Check,
  Mail,
  MessageSquare,
  Sparkles,
  StickyNote,
  Users,
  Video
} from 'lucide-react'
import { useState } from 'react'

import { MeetingTimestampLink } from '#components/meetings/meeting-timestamp-link'
import { useIsDemoUser } from '#hooks/use-is-demo'
import { formatChatMessageTime } from '#lib/format-chat-message-time'
import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'

type MeetingDetailSidebarProps = {
  meeting: MeetingDetail
  meetingId: string
  onSeek: (timestampSec: number) => void
  className?: string
}

function MeetingDetailSidebar({
  meeting,
  meetingId,
  onSeek,
  className
}: MeetingDetailSidebarProps) {
  const isDemo = useIsDemoUser()
  const title =
    meeting.title.trim().length > 0 ? meeting.title : 'Untitled call'
  const patchActionItem = usePatchMeetingActionItemMutation()
  const [copiedFollowUp, setCopiedFollowUp] = useState(false)

  const highlights = meeting.highlights
    .filter((highlight) => highlight.endTimestampSec != null)
    .sort((left, right) => left.timestampSec - right.timestampSec)

  const scratchpadEntries = [...(meeting.scratchpadEntries ?? [])].sort(
    (left, right) => left.timestampSec - right.timestampSec
  )

  function toggleActionItem(actionItemId: string, completed: boolean) {
    patchActionItem.mutate({
      meetingId,
      actionItemId,
      completed
    })
  }

  async function handleCopyFollowUpEmail() {
    if (meeting.actionItems.length === 0) {
      return
    }
    const lines = meeting.actionItems.map((item) => {
      const prefix = item.completed ? '[x]' : '[ ]'
      return `${prefix} ${item.text}`
    })
    const body = `Follow-up from ${title}:\n\n${lines.join('\n')}`
    await navigator.clipboard.writeText(body)
    setCopiedFollowUp(true)
    window.setTimeout(() => {
      setCopiedFollowUp(false)
    }, 2000)
  }

  return (
    <aside className={cn('flex flex-col gap-6', className)}>
      {/* 1. Attendees (Requirement 6) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground size-3.5" />
          <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Attendees ({meeting.participants.length})
          </h2>
        </div>

        {meeting.participants.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No attendees recorded.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {meeting.participants.map((participant) => {
              const label = participant.name
              const initials = label.slice(0, 2).toUpperCase()

              return (
                <li
                  key={participant.id}
                  className="flex items-center gap-2.5 rounded-lg py-1"
                >
                  {participant.profilePicture ? (
                    <img
                      src={participant.profilePicture}
                      alt={label}
                      className="border-border size-7 rounded-full border object-cover"
                    />
                  ) : (
                    <span
                      className="bg-secondary text-secondary-foreground flex size-7 items-center justify-center rounded-full text-[11px] font-semibold select-none"
                      aria-hidden
                    >
                      {initials}
                    </span>
                  )}
                  <span className="text-foreground min-w-0 truncate text-xs font-medium">
                    {label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* 2. Action Items (Requirement 6) */}
      <section className="border-border/60 flex flex-col gap-3 border-t pt-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="text-muted-foreground size-3.5" />
            <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Action Items ({meeting.actionItems.length})
            </h2>
          </div>

          {meeting.actionItems.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-6 gap-1 px-2 text-[11px]"
              onClick={() => {
                void handleCopyFollowUpEmail()
              }}
            >
              {copiedFollowUp ? (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span>Copied email</span>
                </>
              ) : (
                <>
                  <Mail className="size-3" />
                  <span>Copy email</span>
                </>
              )}
            </Button>
          ) : null}
        </div>

        {meeting.actionItems.length === 0 ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            No action items recorded for this call.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {meeting.actionItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 text-xs leading-snug"
              >
                <Tooltip
                  content={
                    isDemo
                      ? 'Action item updates are unavailable for the demo account. Sign in with Google for complete access.'
                      : item.completed
                        ? 'Mark action item incomplete'
                        : 'Mark action item complete'
                  }
                >
                  <span className="inline-flex">
                    <button
                      type="button"
                      className={cn(
                        'border-border mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors',
                        item.completed &&
                          'border-primary bg-primary text-primary-foreground'
                      )}
                      aria-label={
                        item.completed
                          ? 'Mark action item incomplete'
                          : 'Mark action item complete'
                      }
                      disabled={patchActionItem.isPending || isDemo}
                      onClick={() => {
                        toggleActionItem(item.id, !item.completed)
                      }}
                    >
                      {item.completed ? (
                        <Check
                          aria-hidden
                          className="size-2.5"
                          strokeWidth={3}
                        />
                      ) : null}
                    </button>
                  </span>
                </Tooltip>
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
                    <div className="mt-1 flex items-center gap-1">
                      <Sparkles
                        aria-hidden
                        className="text-primary/70 size-2.5 shrink-0"
                      />
                      <MeetingTimestampLink
                        timestampSec={item.timestampSec}
                        onSeek={onSeek}
                        className="text-primary font-mono text-[11px] tabular-nums hover:underline"
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Chat Messages (Requirement 6) */}
      <section className="border-border/60 flex flex-col gap-3 border-t pt-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-muted-foreground size-3.5" />
          <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Chat Messages ({meeting.chatMessages.length})
          </h2>
        </div>

        {meeting.chatMessages.length === 0 ? (
          <p className="text-muted-foreground text-xs leading-relaxed">
            No chat messages in this call.
          </p>
        ) : (
          <ul className="flex max-h-56 flex-col gap-2.5 overflow-y-auto pr-1">
            {meeting.chatMessages.map((message) => (
              <li key={message.id} className="flex flex-col gap-0.5 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-foreground min-w-0 truncate font-semibold">
                    {message.senderName}
                  </span>
                  <time
                    dateTime={message.sentAt}
                    className="text-muted-foreground shrink-0 text-[10px] tabular-nums"
                  >
                    {formatChatMessageTime(message.sentAt)}
                  </time>
                </div>
                <p className="text-foreground/80 leading-relaxed break-words">
                  {message.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Highlights (Requirement 7) */}
      {highlights.length > 0 ? (
        <section className="border-border/60 flex flex-col gap-3 border-t pt-5">
          <div className="flex items-center gap-2">
            <Video className="text-muted-foreground size-3.5" />
            <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Highlights ({highlights.length})
            </h2>
          </div>

          <ul className="flex flex-col gap-2">
            {highlights.map((highlight) => {
              const endSec = highlight.endTimestampSec ?? highlight.timestampSec
              const rangeLabel =
                endSec > highlight.timestampSec
                  ? `${formatPlaybackTimestamp(highlight.timestampSec)} – ${formatPlaybackTimestamp(endSec)}`
                  : formatPlaybackTimestamp(highlight.timestampSec)
              const label =
                highlight.note?.trim() ||
                `Highlight at ${formatPlaybackTimestamp(highlight.timestampSec)}`

              return (
                <li
                  key={highlight.id}
                  className="bg-muted/30 flex flex-col gap-1 rounded-lg px-2.5 py-2"
                >
                  <button
                    type="button"
                    className="text-foreground text-left text-xs font-medium hover:underline"
                    onClick={() => {
                      onSeek(highlight.timestampSec)
                    }}
                  >
                    {label}
                  </button>
                  <div className="flex items-center gap-2">
                    <MeetingTimestampLink
                      timestampSec={highlight.timestampSec}
                      onSeek={onSeek}
                      className="text-primary font-mono text-[11px] tabular-nums hover:underline"
                    />
                    <span className="text-muted-foreground text-[11px] tabular-nums">
                      ({rangeLabel})
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {/* 5. Scratchpad Notes (Requirement 7) */}
      {scratchpadEntries.length > 0 ? (
        <section className="border-border/60 flex flex-col gap-3 border-t pt-5">
          <div className="flex items-center gap-2">
            <StickyNote className="text-muted-foreground size-3.5" />
            <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Scratchpad Notes ({scratchpadEntries.length})
            </h2>
          </div>

          <ul className="flex flex-col gap-2">
            {scratchpadEntries.map((entry) => (
              <li
                key={entry.id}
                className="bg-muted/30 flex flex-col gap-1 rounded-lg px-2.5 py-2"
              >
                <MeetingTimestampLink
                  timestampSec={entry.timestampSec}
                  onSeek={onSeek}
                  className="text-primary w-fit font-mono text-[11px] tabular-nums hover:underline"
                />
                <p className="text-foreground/85 text-xs leading-relaxed whitespace-pre-wrap">
                  {entry.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  )
}

export { MeetingDetailSidebar }
