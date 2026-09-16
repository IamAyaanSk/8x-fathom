import { usePostMeetingSummaryGenerateMutation } from '@repo/api-client/v1/meetings/hooks'
import type { MeetingDetail } from '@repo/api-client/v1/meetings/index'
import { Button } from '@repo/ui-web/components/button'
import { Copy, Loader2, Sparkles } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import {
  MeetingRecreateSummaryDialog,
  type MeetingRecreateSummarySubmit
} from '#components/meetings/meeting-recreate-summary-dialog'
import { MeetingSummaryCaptureSections } from '#components/meetings/meeting-summary-capture-sections'

type MeetingSummaryPanelProps = {
  meeting: Pick<MeetingDetail, 'summary' | 'highlights'> &
    Partial<Pick<MeetingDetail, 'id' | 'scratchpadEntries'>>
  onSeek: (timestampSec: number) => void
  canRecreateSummary: boolean
  readOnly?: boolean
}

function _renderSummaryBody(body: string) {
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
        {listItems.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-muted-foreground" aria-hidden>
              •
            </span>
            <span>{item.replace(/^[-*]\s*/, '')}</span>
          </li>
        ))}
      </ul>
    )
    listItems = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
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
        </p>
      )
    }
  }
  flushList()

  return elements
}

function _renderSummaryMarkdown(summary: string) {
  const sections = summary
    .split(/^## /m)
    .filter((part) => part.trim().length > 0)

  if (sections.length <= 1 && !summary.includes('## ')) {
    return (
      <div className="flex flex-col gap-3">{_renderSummaryBody(summary)}</div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => {
        const [headingLine, ...bodyLines] = section.split('\n')
        const heading = headingLine?.trim() ?? 'Summary'
        const body = bodyLines.join('\n').trim()

        return (
          <section key={heading} className="flex flex-col gap-3">
            <h3 className="text-foreground text-base font-semibold">
              {heading}
            </h3>
            {body.length > 0 ? (
              <div className="flex flex-col gap-3">
                {_renderSummaryBody(body)}
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
    response?: { data?: { message?: string } }
  }
  const message = axiosLike.response?.data?.message
  if (typeof message === 'string' && message.length > 0) {
    return message
  }
  return 'Summary could not be recreated. Try again.'
}

function MeetingSummaryPanel({
  meeting,
  onSeek,
  canRecreateSummary,
  readOnly = false
}: MeetingSummaryPanelProps) {
  const meetingId = meeting.id
  const summary = meeting.summary
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

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
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!readOnly && canRecreateSummary && meetingId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={generateSummary.isPending}
              onClick={openRecreateDialog}
            >
              {generateSummary.isPending ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : (
                <Sparkles aria-hidden className="size-4" />
              )}
              Recreate
            </Button>
          ) : null}
          {!readOnly && summary ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="tracking-wide uppercase"
              onClick={handleCopy}
            >
              <Copy aria-hidden className="size-4" />
              {copied ? 'Copied' : 'Copy summary'}
            </Button>
          ) : null}
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

        <MeetingSummaryCaptureSections
          meeting={meeting}
          onSeek={onSeek}
          className="border-border border-b pb-8"
        />

        {!summary ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {canRecreateSummary
              ? 'No summary yet. Use Recreate to generate one from the transcript.'
              : 'Summary is not ready yet. It appears after the call is processed.'}
          </p>
        ) : (
          _renderSummaryMarkdown(summary)
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
