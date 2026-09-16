import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'

type MeetingTimestampLinkProps = {
  timestampSec: number
  onSeek: (timestampSec: number) => void
  className?: string
}

function MeetingTimestampLink({
  timestampSec,
  onSeek,
  className
}: MeetingTimestampLinkProps) {
  return (
    <button
      type="button"
      className={
        className ??
        'text-primary shrink-0 font-medium tabular-nums hover:underline'
      }
      onClick={() => {
        onSeek(timestampSec)
      }}
    >
      @ {formatPlaybackTimestamp(timestampSec)}
    </button>
  )
}

export { MeetingTimestampLink }
