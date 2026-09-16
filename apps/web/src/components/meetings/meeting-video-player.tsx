import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'
import { formatRecordingDurationLabel } from '#lib/format-recording-duration-label'

const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const

type MeetingVideoPlayerProps = {
  meeting: MeetingDetail
  onSeekReady: (seekTo: (timestampSec: number) => void) => void
  onTimeUpdate: (currentTimeSec: number) => void
}

function MeetingVideoPlayer({
  meeting,
  onSeekReady,
  onTimeUpdate
}: MeetingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrubRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTimeSec, setCurrentTimeSec] = useState(0)
  const [durationSec, setDurationSec] = useState(
    meeting.recordingDurationSec ?? 0
  )
  const [playbackRateIndex, setPlaybackRateIndex] = useState(0)

  const playbackUrl = meeting.recordingPlayback?.url ?? null
  const highlightMarkers = meeting.highlights.filter(
    (highlight) => highlight.endTimestampSec != null
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackUrl) {
      return
    }

    function seekTo(timestampSec: number) {
      const maxDuration =
        Number.isFinite(video!.duration) && video!.duration > 0
          ? video!.duration
          : durationSec
      const clamped = Math.min(Math.max(0, timestampSec), maxDuration)
      video!.currentTime = clamped
      setCurrentTimeSec(clamped)
      onTimeUpdate(clamped)
      void video!.play().catch(() => undefined)
      setIsPlaying(true)
    }

    onSeekReady(seekTo)
  }, [durationSec, onSeekReady, onTimeUpdate, playbackUrl])

  function _seekFromClientX(clientX: number) {
    const scrub = scrubRef.current
    const video = videoRef.current
    if (!scrub || !video) {
      return
    }
    const rect = scrub.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const duration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : durationSec
    if (duration <= 0) {
      return
    }
    const nextTime = ratio * duration
    video.currentTime = nextTime
    setCurrentTimeSec(nextTime)
    onTimeUpdate(nextTime)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) {
      return
    }
    if (video.paused) {
      void video.play().catch(() => undefined)
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) {
      return
    }
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  function cyclePlaybackRate() {
    const video = videoRef.current
    if (!video) {
      return
    }
    const nextIndex = (playbackRateIndex + 1) % PLAYBACK_RATES.length
    const nextRate = PLAYBACK_RATES[nextIndex] ?? 1
    video.playbackRate = nextRate
    setPlaybackRateIndex(nextIndex)
  }

  function toggleFullscreen() {
    const video = videoRef.current
    if (!video) {
      return
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    void video.requestFullscreen().catch(() => undefined)
  }

  if (!playbackUrl) {
    return (
      <div className="bg-card ring-border flex aspect-video w-full items-center justify-center rounded-2xl ring-1">
        <p className="text-muted-foreground max-w-sm px-6 text-center text-sm leading-relaxed">
          Recording is not available yet. Check back when processing finishes.
        </p>
      </div>
    )
  }

  const scrubDuration =
    durationSec > 0 ? durationSec : (meeting.recordingDurationSec ?? 1)
  const progressPercent =
    scrubDuration > 0
      ? Math.min(100, (currentTimeSec / scrubDuration) * 100)
      : 0
  const playbackRate = PLAYBACK_RATES[playbackRateIndex] ?? 1

  return (
    <div className="bg-card ring-border overflow-hidden rounded-2xl ring-1">
      <div className="relative bg-black">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black"
          playsInline
          preload="metadata"
          src={playbackUrl}
          onClick={togglePlay}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget
            if (Number.isFinite(video.duration) && video.duration > 0) {
              setDurationSec(Math.floor(video.duration))
            }
          }}
          onPlay={() => {
            setIsPlaying(true)
          }}
          onPause={() => {
            setIsPlaying(false)
          }}
          onTimeUpdate={(event) => {
            const nextTime = event.currentTarget.currentTime
            setCurrentTimeSec(nextTime)
            onTimeUpdate(nextTime)
          }}
        />
        {!isPlaying ? (
          <button
            type="button"
            className="bg-background/20 absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-[1px]"
            aria-label="Play recording"
            onClick={togglePlay}
          >
            <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full shadow-lg">
              <Play aria-hidden className="ml-0.5 size-8" />
            </span>
            {scrubDuration > 0 ? (
              <span className="text-foreground text-sm font-medium tabular-nums">
                {formatRecordingDurationLabel(scrubDuration)}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <div
          ref={scrubRef}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={scrubDuration}
          aria-valuenow={Math.floor(currentTimeSec)}
          aria-label="Recording progress"
          tabIndex={0}
          className="relative h-8 w-full cursor-pointer touch-none"
          onClick={(event) => {
            _seekFromClientX(event.clientX)
          }}
          onKeyDown={(event) => {
            const video = videoRef.current
            if (!video) {
              return
            }
            const step = event.shiftKey ? 10 : 5
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              video.currentTime = Math.min(
                video.duration,
                video.currentTime + step
              )
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              video.currentTime = Math.max(0, video.currentTime - step)
            }
          }}
        >
          <div className="bg-muted absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" />
          <div
            className="bg-primary/80 absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          {highlightMarkers.map((highlight) => {
            const startPercent = Math.min(
              100,
              Math.max(0, (highlight.timestampSec / scrubDuration) * 100)
            )
            const endSec =
              highlight.endTimestampSec ?? highlight.timestampSec
            const endPercent = Math.min(
              100,
              Math.max(0, (endSec / scrubDuration) * 100)
            )
            const rangeWidth = Math.max(endPercent - startPercent, 0.35)
            const isRange = highlight.endTimestampSec != null
            const titleLabel = highlight.note
              ? `${formatPlaybackTimestamp(highlight.timestampSec)} — ${highlight.note}`
              : isRange
                ? `${formatPlaybackTimestamp(highlight.timestampSec)} – ${formatPlaybackTimestamp(endSec)}`
                : formatPlaybackTimestamp(highlight.timestampSec)

            if (isRange) {
              return (
                <span
                  key={highlight.id}
                  className="bg-primary/35 absolute top-1/2 z-10 h-2 -translate-y-1/2 rounded-sm"
                  style={{
                    left: `${startPercent}%`,
                    width: `${rangeWidth}%`
                  }}
                  title={titleLabel}
                />
              )
            }

            return (
              <span
                key={highlight.id}
                className="bg-foreground/90 absolute top-1/2 z-10 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${startPercent}%` }}
                title={titleLabel}
              />
            )
          })}
          <span
            className="bg-primary absolute top-1/2 z-20 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground shrink-0"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
          </Button>
          <p className="text-muted-foreground min-w-0 flex-1 text-xs tabular-nums">
            {formatPlaybackTimestamp(currentTimeSec)}
            {scrubDuration > 0
              ? ` / ${formatPlaybackTimestamp(scrubDuration)}`
              : null}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground shrink-0 tabular-nums"
            onClick={cyclePlaybackRate}
          >
            {playbackRate}x
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground shrink-0"
            aria-label="Fullscreen"
            onClick={toggleFullscreen}
          >
            <Maximize2 aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { MeetingVideoPlayer }
