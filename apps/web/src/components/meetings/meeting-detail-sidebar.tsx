import { usePatchMeetingActionItemMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { meetingParticipantLabel } from '@repo/api-contract/meeting-participants'
import { Button } from '@repo/ui-web/components/button'
import { cn } from '@repo/ui-web/lib/utils'
import {
  Check,
  Link2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Sparkles
} from 'lucide-react'
import { useState } from 'react'

import { MeetingTimestampLink } from '#components/meetings/meeting-timestamp-link'
import { formatChatMessageTime } from '#lib/format-chat-message-time'
import { formatMeetingDetailDate } from '#lib/format-meeting-detail-date'

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
  const title =
    meeting.title.trim().length > 0 ? meeting.title : 'Untitled call'
  const dateLabel = formatMeetingDetailDate(meeting.startTime)
  const patchActionItem = usePatchMeetingActionItemMutation()
  const [copiedFollowUp, setCopiedFollowUp] = useState(false)

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
    <aside className={cn('flex flex-col gap-0', className)}>
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className="text-foreground truncate text-lg leading-snug font-semibold">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{dateLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="default"
            className="min-w-0 flex-1"
            disabled={!meeting.shareSlug}
          >
            <Link2 aria-hidden className="size-4" />
            Share
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="More options"
            disabled
          >
            <MoreHorizontal aria-hidden />
          </Button>
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
            No action items yet. They appear after AI processing finishes.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                disabled
              >
                Copy for …
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  void handleCopyFollowUpEmail()
                }}
              >
                <Mail aria-hidden className="size-4" />
                {copiedFollowUp ? 'Copied' : 'Copy follow-up email'}
              </Button>
            </div>
            <ul className="flex flex-col gap-5">
              {meeting.actionItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 text-sm leading-snug"
                >
                  <button
                    type="button"
                    className={cn(
                      'border-border mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
                      item.completed &&
                        'border-primary bg-primary text-primary-foreground'
                    )}
                    aria-label={
                      item.completed
                        ? 'Mark action item incomplete'
                        : 'Mark action item complete'
                    }
                    disabled={patchActionItem.isPending}
                    onClick={() => {
                      toggleActionItem(item.id, !item.completed)
                    }}
                  >
                    {item.completed ? (
                      <Check aria-hidden className="size-3" strokeWidth={3} />
                    ) : null}
                  </button>
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

      <section className="border-border flex flex-col gap-4 border-t pt-8 pb-8">
        <h2 className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
          Chat messages
        </h2>
        {meeting.chatMessages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <MessageSquare
              aria-hidden
              className="text-muted-foreground size-8 opacity-50"
            />
            <p className="text-muted-foreground text-sm">No chat messages</p>
          </div>
        ) : (
          <ul className="flex max-h-[min(24rem,40vh)] flex-col gap-4 overflow-y-auto pr-1">
            {meeting.chatMessages.map((message) => (
              <li key={message.id} className="flex flex-col gap-1 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-foreground min-w-0 truncate font-medium">
                    {message.senderName}
                  </span>
                  <time
                    dateTime={message.sentAt}
                    className="text-muted-foreground shrink-0 text-xs tabular-nums"
                  >
                    {formatChatMessageTime(message.sentAt)}
                  </time>
                </div>
                <p className="text-foreground/90 leading-relaxed break-words">
                  {message.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}

export { MeetingDetailSidebar }
