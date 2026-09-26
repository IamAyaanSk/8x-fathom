import type { MeetingPlaybackMedia } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import {
  Maximize2,
  Pause,
  Play,
  VideoOff,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { formatPlaybackTimestamp } from '#lib/format-playback-timestamp'
import { formatRecordingDurationLabel } from '#lib/format-recording-duration-label'

const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const

type MeetingVideoPlayerProps = {
  meeting: MeetingPlaybackMedia
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
      <div className="bg-muted/40 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl p-4 text-center">
        <VideoOff className="text-muted-foreground/60 size-5" />
        <p className="text-muted-foreground text-xs leading-relaxed">
          No recording available for this call.
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
    <div className="bg-card overflow-hidden rounded-xl shadow-xs">
      <div className="group relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
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
            className="bg-background/25 absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-[1px] transition-opacity"
            aria-label="Play recording"
            onClick={togglePlay}
          >
            <span className="bg-background/90 text-foreground flex size-12 items-center justify-center rounded-full shadow-md backdrop-blur-xs transition-transform duration-200 hover:scale-105">
              <Play aria-hidden className="fill-foreground ml-0.5 size-5" />
            </span>
            {scrubDuration > 0 ? (
              <span className="bg-background/80 text-foreground rounded-md px-2 py-0.5 text-xs font-medium tabular-nums backdrop-blur-xs">
                {formatRecordingDurationLabel(scrubDuration)}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>

      {/* Scrubber & Controls */}
      <div className="flex flex-col gap-1.5 p-3">
        {/* Scrubber line */}
        <div
          ref={scrubRef}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={scrubDuration}
          aria-valuenow={Math.floor(currentTimeSec)}
          aria-label="Recording progress"
          tabIndex={0}
          className="group/scrub relative flex h-4 w-full cursor-pointer touch-none items-center"
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
          <div className="bg-muted relative h-1.5 w-full overflow-hidden rounded-full transition-all group-hover/scrub:h-2">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {highlightMarkers.map((highlight) => {
            const startPercent = Math.min(
              100,
              Math.max(0, (highlight.timestampSec / scrubDuration) * 100)
            )
            return (
              <span
                key={highlight.id}
                className="bg-primary/50 absolute top-1/2 z-10 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${startPercent}%` }}
              />
            )
          })}

          <span
            className="bg-primary absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 shadow-xs transition-opacity group-hover/scrub:opacity-100"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Minimal Control Bar */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-foreground size-7 rounded-md"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause aria-hidden className="size-3.5" />
              ) : (
                <Play aria-hidden className="size-3.5 fill-current" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground size-7 rounded-md"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX aria-hidden className="size-3.5" />
              ) : (
                <Volume2 aria-hidden className="size-3.5" />
              )}
            </Button>
            <span className="text-muted-foreground pl-1 font-mono text-[11px] tabular-nums">
              {formatPlaybackTimestamp(currentTimeSec)} /{' '}
              {formatPlaybackTimestamp(scrubDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-6 px-1.5 font-mono text-[11px] tabular-nums"
              onClick={cyclePlaybackRate}
            >
              {playbackRate}x
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground size-7 rounded-md"
              aria-label="Fullscreen"
              onClick={toggleFullscreen}
            >
              <Maximize2 aria-hidden className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { MeetingVideoPlayer }
