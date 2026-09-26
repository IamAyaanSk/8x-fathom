import { useChat } from '@ai-sdk/react'
import { Bubble, BubbleContent } from '@repo/ui-web/components/bubble'
import { Button } from '@repo/ui-web/components/button'
import { Marker, MarkerContent } from '@repo/ui-web/components/marker'
import {
  Message,
  MessageContent,
  MessageHeader
} from '@repo/ui-web/components/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport
} from '@repo/ui-web/components/message-scroller'
import { Textarea } from '@repo/ui-web/components/textarea'
import { cn } from '@repo/ui-web/lib/utils'
import { DefaultChatTransport } from 'ai'
import {
  ArrowUp,
  ArrowUpRight,
  CheckSquare,
  ListTree,
  RotateCcw,
  Sparkles,
  Square,
  Users
} from 'lucide-react'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import {
  MEETING_ASSISTANT_API,
  type MeetingAssistantUIMessage
} from '#lib/meeting-assistant-api'

const MAX_MESSAGE_LENGTH = 300

type StarterQuestion = {
  icon: typeof ListTree
  title: string
  question: string
}

const LIBRARY_STARTER_QUESTIONS: readonly StarterQuestion[] = [
  {
    icon: CheckSquare,
    title: 'Action items',
    question: 'What are action items across my recent meetings?'
  },
  {
    icon: ListTree,
    title: 'Key decisions',
    question: 'What major decisions were agreed upon across recent calls?'
  },
  {
    icon: Sparkles,
    title: 'Recent updates',
    question: 'Summarize the latest project progress and roadmap discussions.'
  },
  {
    icon: Users,
    title: 'Commitments',
    question: 'Who committed to deliverables or follow-ups this week?'
  }
] as const

const MEETING_STARTER_QUESTIONS: readonly StarterQuestion[] = [
  {
    icon: ListTree,
    title: 'Decisions',
    question: 'What were the main decisions made in this call?'
  },
  {
    icon: CheckSquare,
    title: 'Action items',
    question: 'Summarize the action items and assignees from this meeting.'
  },
  {
    icon: Sparkles,
    title: 'Key takeaways',
    question: 'Give me a quick bulleted summary of the main discussion points.'
  },
  {
    icon: Users,
    title: 'Follow-ups',
    question: 'What follow-ups or next steps were agreed upon in this call?'
  }
] as const

type MeetingAskFathomPanelProps = {
  meetingId?: string
  disabledReason?: string
  className?: string
  showIntro?: boolean
  starterQuestions?: readonly StarterQuestion[]
}

function getMessageText(message: MeetingAssistantUIMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

function AssistantMessage({ message }: { message: MeetingAssistantUIMessage }) {
  return (
    <Message align="start">
      <MessageContent>
        <MessageHeader>Ask Fathom</MessageHeader>
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            if (!part.text.trim()) {
              return null
            }
            return (
              <Bubble key={index} variant="muted">
                <BubbleContent>
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground underline decoration-dotted underline-offset-4"
                        >
                          {children}
                        </a>
                      ),
                      code: ({ className, children, ...props }) => (
                        <code
                          className={cn(
                            'bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em]',
                            className
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-muted my-3 overflow-x-auto rounded-lg p-3 text-xs">
                          {children}
                        </pre>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                          {children}
                        </ol>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-border text-muted-foreground mb-3 border-l-2 pl-3 last:mb-0">
                          {children}
                        </blockquote>
                      )
                    }}
                  >
                    {part.text}
                  </ReactMarkdown>
                </BubbleContent>
              </Bubble>
            )
          }

          if (part.type === 'tool-searchAllMeetBase') {
            if (
              part.state === 'input-streaming' ||
              part.state === 'input-available'
            ) {
              return (
                <Marker key={part.toolCallId} role="status">
                  <MarkerContent>Searching transcripts…</MarkerContent>
                </Marker>
              )
            }
            if (part.state === 'output-error') {
              return (
                <Marker
                  key={part.toolCallId}
                  role="alert"
                  className="text-destructive"
                >
                  <MarkerContent>Search failed. Try again.</MarkerContent>
                </Marker>
              )
            }
          }

          return null
        })}
      </MessageContent>
    </Message>
  )
}

function MeetingAskFathomPanel({
  meetingId,
  disabledReason,
  className,
  showIntro = true,
  starterQuestions
}: MeetingAskFathomPanelProps) {
  const [input, setInput] = useState('')
  const starters =
    starterQuestions ??
    (showIntro ? MEETING_STARTER_QUESTIONS : LIBRARY_STARTER_QUESTIONS)

  const transport = useMemo(
    () =>
      new DefaultChatTransport<MeetingAssistantUIMessage>({
        api: MEETING_ASSISTANT_API,
        body: meetingId ? { meetingId } : undefined,
        credentials: 'include',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }),
    [meetingId]
  )

  const { error, messages, regenerate, sendMessage, status, stop } =
    useChat<MeetingAssistantUIMessage>({
      transport
    })

  const busy = status === 'submitted' || status === 'streaming'

  let activity: string | null = null
  if (error) {
    activity = 'Something went wrong processing the request.'
  } else if (status === 'submitted') {
    activity = 'Thinking…'
  } else if (status === 'streaming') {
    activity = 'Writing…'
  }

  function submit() {
    const message = input.trim()
    if (!message || message.length > MAX_MESSAGE_LENGTH || busy) {
      return
    }
    void sendMessage({ text: message })
    setInput('')
  }

  function handleSelectStarter(question: string) {
    if (busy) {
      return
    }
    void sendMessage({ text: question })
  }

  if (disabledReason) {
    const isDemo = disabledReason.toLowerCase().includes('demo')
    return (
      <div
        className={
          isDemo
            ? 'bg-demo/10 border-demo/30 text-demo-foreground flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm'
            : 'text-muted-foreground text-sm leading-relaxed'
        }
      >
        {isDemo ? (
          <span className="shrink-0 text-base leading-none">🧪</span>
        ) : null}
        {disabledReason}
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-[32rem] flex-col', className)}>
      <MessageScrollerProvider
        autoScroll
        defaultScrollPosition="end"
        scrollPreviousItemPeek={48}
      >
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent aria-busy={busy} className="px-1">
              {messages.length === 0 ? (
                <MessageScrollerItem className="my-auto py-4">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="bg-muted text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-xl">
                      <Sparkles className="size-5" aria-hidden />
                    </div>
                    <p className="text-foreground text-sm font-semibold">
                      What would you like to know?
                    </p>
                    <p className="text-muted-foreground mt-1 max-w-64 text-xs leading-5">
                      Pick a question or ask anything about your meetings.
                    </p>
                  </div>
                  <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
                    {starters.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.question}
                          type="button"
                          disabled={busy}
                          onClick={() => handleSelectStarter(item.question)}
                          className="border-border hover:bg-muted group relative flex flex-col items-start justify-between rounded-xl border p-3 text-left"
                        >
                          <div className="text-muted-foreground mb-2 flex w-full items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Icon className="size-3.5 shrink-0" aria-hidden />
                              <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
                                {item.title}
                              </span>
                            </div>
                            <ArrowUpRight
                              className="text-muted-foreground size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                              aria-hidden
                            />
                          </div>
                          <span className="text-foreground/90 group-hover:text-foreground text-xs font-normal transition-colors">
                            {item.question}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </MessageScrollerItem>
              ) : null}

              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === 'user'}
                >
                  {message.role === 'user' ? (
                    <Message align="end">
                      <MessageContent>
                        <Bubble>
                          <BubbleContent>
                            {getMessageText(message)}
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  ) : (
                    <AssistantMessage message={message} />
                  )}
                </MessageScrollerItem>
              ))}

              {activity ? (
                <MessageScrollerItem messageId="assistant-activity">
                  {error ? (
                    <Marker role="alert" className="text-destructive">
                      <MarkerContent>{activity}</MarkerContent>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          void regenerate()
                        }}
                        size="icon-xs"
                        aria-label="Retry"
                      >
                        <RotateCcw />
                      </Button>
                    </Marker>
                  ) : (
                    <Marker role="status">
                      <MarkerContent>{activity}</MarkerContent>
                    </Marker>
                  )}
                </MessageScrollerItem>
              ) : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className="border-border bg-muted/40 mt-4 flex flex-col rounded-3xl border p-3"
      >
        <Textarea
          value={input}
          onChange={(event) =>
            setInput(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={busy}
          placeholder="Ask about your meetings…"
          aria-label="Message Ask Fathom"
          className="min-h-16 resize-none border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between pt-1 pr-0.5 pl-2">
          <span
            className={cn(
              'text-[11px] transition-opacity',
              input.length === 0 ? 'opacity-0' : 'opacity-100',
              input.length === MAX_MESSAGE_LENGTH
                ? 'text-destructive'
                : 'text-muted-foreground'
            )}
          >
            {input.length}/{MAX_MESSAGE_LENGTH}
          </span>
          {busy ? (
            <Button
              type="button"
              size="icon-sm"
              onClick={() => {
                void stop()
              }}
              aria-label="Stop generation"
            >
              <Square className="size-3 fill-current" aria-hidden />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-sm"
              disabled={!input.trim()}
              aria-label="Send message"
            >
              <ArrowUp className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export {
  LIBRARY_STARTER_QUESTIONS,
  MEETING_STARTER_QUESTIONS,
  MeetingAskFathomPanel
}
export type { StarterQuestion }
