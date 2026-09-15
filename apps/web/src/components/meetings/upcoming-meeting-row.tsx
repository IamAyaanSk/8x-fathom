import type { MeetingListItem } from '@repo/api-client/v1/meetings/index'
import { Button, buttonVariants } from '@repo/ui-web/components/button'
import { Tooltip } from '@repo/ui-web/components/tooltip'
import { cn } from '@repo/ui-web/lib/utils'
import { CircleDot } from 'lucide-react'

import { formatMeetingStartTime } from '#lib/format-meeting-time'

const CAPTURE_HINT = 'Use this to start capture now for this meet.'

type UpcomingMeetingRowProps = {
  meeting: MeetingListItem
}

function UpcomingMeetingRow({ meeting }: UpcomingMeetingRowProps) {
  const title =
    meeting.title.trim().length > 0 ? meeting.title.trim() : 'Untitled meeting'

  return (
    <li className="border-border flex flex-wrap items-center justify-between gap-4 border-b py-5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-base font-semibold leading-snug">
          {title}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatMeetingStartTime(meeting.startTime)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={meeting.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'secondary', size: 'sm' }),
            'rounded-full'
          )}
        >
          Join
        </a>
        <Tooltip content={CAPTURE_HINT}>
          <span className="inline-flex">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              disabled
              aria-label={CAPTURE_HINT}
            >
              <CircleDot className="size-4" aria-hidden />
              Capture
            </Button>
          </span>
        </Tooltip>
      </div>
    </li>
  )
}

export { UpcomingMeetingRow }
