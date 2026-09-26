import { usePostMeetingSummaryGenerateMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import { Check, Copy, Loader2, Sparkles } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import {
  MeetingRecreateSummaryDialog,
  type MeetingRecreateSummarySubmit
} from '#components/meetings/meeting-recreate-summary-dialog'

type MeetingSummaryPanelProps = {
  meeting: Pick<MeetingDetail, 'summary'> &
    Partial<
      Pick<MeetingDetail, 'id' | 'uiPhase' | 'baasStatus' | 'processingStatus'>
    >
  canRecreateSummary: boolean
  readOnly?: boolean
  onSeek?: (timestampSec: number) => void
}

function useStreamedText(text: string | null | undefined, speedMs = 16) {
  const [displayedLength, setDisplayedLength] = useState(() => (text ? 0 : 0))
  const [isStreaming, setIsStreaming] = useState(false)
  const prevTextRef = useRef(text)

  useEffect(() => {
    if (!text) {
      setDisplayedLength(0)
      setIsStreaming(false)
      prevTextRef.current = text
      return
    }

    if (prevTextRef.current !== text) {
      prevTextRef.current = text
      setDisplayedLength(0)
      setIsStreaming(true)
      return
    }

    if (displayedLength >= text.length) {
      setIsStreaming(false)
      return
    }

    setIsStreaming(true)
    const interval = window.setInterval(() => {
      setDisplayedLength((current) => {
        const step = Math.floor(Math.random() * 4) + 4
        const next = Math.min(text.length, current + step)
        if (next >= text.length) {
          setIsStreaming(false)
          window.clearInterval(interval)
        }
        return next
      })
    }, speedMs)

    return () => window.clearInterval(interval)
  }, [text, displayedLength, speedMs])

  const skip = useCallback(() => {
    if (text) {
      setDisplayedLength(text.length)
      setIsStreaming(false)
    }
  }, [text])

  const replay = useCallback(() => {
    if (text) {
      setDisplayedLength(0)
      setIsStreaming(true)
    }
  }, [text])

  const displayedText = text ? text.slice(0, displayedLength) : ''

  return { displayedText, isStreaming, skip, replay }
}

function _renderSummaryBody(body: string, isStreaming = false) {
  const lines = body.split('\n')
  const elements: ReactNode[] = []
  let listItems: string[] = []

  function flushList() {
    if (listItems.length === 0) {
      return
    }
    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="text-foreground/90 flex flex-col gap-2 pl-1 text-sm leading-relaxed"
      >
        {listItems.map((item, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="text-muted-foreground select-none" aria-hidden>
              •
            </span>
            <span>{item.replace(/^[-*]\s*/, '')}</span>
          </li>
        ))}
      </ul>
    )
    listItems = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const trimmed = line.trim()
    const isLastLine = i === lines.length - 1

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed)
      continue
    }

    flushList()
    if (trimmed.length > 0) {
      elements.push(
        <p
          key={`p-${elements.length}-${trimmed.slice(0, 12)}`}
          className="text-foreground/90 text-sm leading-relaxed"
        >
          {trimmed}
          {isStreaming && isLastLine ? (
            <span
              className="bg-primary/80 ml-1 inline-block h-3.5 w-1.5 animate-pulse rounded-xs align-middle"
              aria-hidden
            />
          ) : null}
        </p>
      )
    }
  }
  flushList()

  return elements
}

function _renderSummaryMarkdown(summary: string, isStreaming = false) {
  const sections = summary
    .split(/^## /m)
    .filter((part) => part.trim().length > 0)

  if (sections.length <= 1 && !summary.includes('## ')) {
    return (
      <div className="flex flex-col gap-3">
        {_renderSummaryBody(summary, isStreaming)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section, sIdx) => {
        const [headingLine, ...bodyLines] = section.split('\n')
        const heading = headingLine?.trim() ?? 'Summary'
        const body = bodyLines.join('\n').trim()
        const isLastSection = sIdx === sections.length - 1

        return (
          <section key={heading} className="flex flex-col gap-2.5">
            <h3 className="text-foreground font-sans text-base font-semibold tracking-tight">
              {heading}
            </h3>
            {body.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {_renderSummaryBody(body, isStreaming && isLastSection)}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

function _summaryGenerateErrorMessage(error: Error): string {
  const axiosLike = error as Error & {
    code?: string
    response?: { data?: { message?: string } }
  }
  const message = axiosLike.response?.data?.message
  if (typeof message === 'string' && message.length > 0) {
    return message
  }
  if (
    axiosLike.code === 'ECONNABORTED' ||
    error.message.toLowerCase().includes('timeout')
  ) {
    return 'Summary generation timed out. Please try again.'
  }
  return 'Summary could not be recreated. Try again.'
}

function MeetingSummaryPanel({
  meeting,
  canRecreateSummary,
  readOnly = false
}: MeetingSummaryPanelProps) {
  const meetingId = meeting.id
  const summary = meeting.summary
  const isFailed =
    meeting.uiPhase === 'failed_to_join' ||
    meeting.uiPhase === 'failed_processing' ||
    meeting.baasStatus === 'failed' ||
    meeting.processingStatus === 'failed'
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const { displayedText, isStreaming } = useStreamedText(summary)

  const generateSummary = usePostMeetingSummaryGenerateMutation()

  function openRecreateDialog() {
    if (!canRecreateSummary || !meetingId) {
      return
    }
    setGenerateError(null)
    setDialogOpen(true)
  }

  function handleDialogSubmit(payload: MeetingRecreateSummarySubmit) {
    if (!meetingId) {
      return
    }
    setGenerateError(null)
    generateSummary.mutate(
      {
        meetingId,
        body: {
          template: payload.template,
          ...(payload.detail !== undefined ? { detail: payload.detail } : {})
        }
      },
      {
        onSuccess: () => {
          setDialogOpen(false)
        },
        onError: (error) => {
          setGenerateError(_summaryGenerateErrorMessage(error))
        }
      }
    )
  }

  async function handleCopy() {
    if (!summary) {
      return
    }
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    window.setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
              <Sparkles className="size-3.5" />
            </span>
            <span className="text-foreground text-xs font-semibold tracking-wider uppercase">
              AI Summary
            </span>
            {isStreaming ? (
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <span className="bg-primary inline-block size-1.5 animate-pulse rounded-full" />
                streaming…
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {!readOnly && canRecreateSummary && meetingId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2.5 text-xs shadow-2xs"
                disabled={generateSummary.isPending}
                onClick={openRecreateDialog}
              >
                {generateSummary.isPending ? (
                  <Loader2 aria-hidden className="size-3 animate-spin" />
                ) : (
                  <Sparkles aria-hidden className="size-3" />
                )}
                <span>Recreate</span>
              </Button>
            ) : null}

            {!readOnly && summary ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2.5 text-xs shadow-2xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check aria-hidden className="size-3 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy aria-hidden className="size-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        {generateSummary.isPending ? (
          <div
            className="text-muted-foreground flex items-center gap-2 text-sm"
            role="status"
          >
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Recreating summary…
          </div>
        ) : null}

        {!summary ? (
          isFailed ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Something went wrong processing or there was not enough media to
              process.
            </p>
          ) : canRecreateSummary ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              No summary yet. Use Recreate to generate one from the transcript.
            </p>
          ) : (
            <div className="bg-muted/30 flex items-center gap-3.5 rounded-xl p-6 text-left">
              <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Loader2 aria-hidden className="size-4 animate-spin" />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-foreground text-sm font-medium">
                  Generating call summary…
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  This takes a few minutes while we analyze your meeting.
                </p>
              </div>
            </div>
          )
        ) : (
          _renderSummaryMarkdown(displayedText, isStreaming)
        )}
      </div>

      <MeetingRecreateSummaryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isPending={generateSummary.isPending}
        errorMessage={generateError}
        onSubmit={handleDialogSubmit}
      />
    </>
  )
}

export { MeetingSummaryPanel }
