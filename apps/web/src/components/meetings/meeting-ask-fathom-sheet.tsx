import { Button } from '@repo/ui-web/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@repo/ui-web/components/sheet'
import { cn } from '@repo/ui-web/lib/utils'
import { Sparkles } from 'lucide-react'
import type { ReactElement } from 'react'
import { useState } from 'react'

import {
  LIBRARY_STARTER_QUESTIONS,
  MeetingAskFathomPanel
} from '#components/meetings/meeting-ask-fathom-panel'

type MeetingAskFathomSheetProps = {
  meetingId?: string
  disabledReason?: string
  triggerClassName?: string
  trigger?: ReactElement
}

function MeetingAskFathomSheet({
  meetingId,
  disabledReason,
  triggerClassName,
  trigger
}: MeetingAskFathomSheetProps) {
  const [open, setOpen] = useState(false)
  const [chatMounted, setChatMounted] = useState(false)
  const disabled = disabledReason != null

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setChatMounted(true)
        }
      }}
    >
      <SheetTrigger
        render={
          trigger ?? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              title={disabledReason}
              className={cn('shrink-0', triggerClassName)}
            >
              <Sparkles aria-hidden />
              Ask Fathom
            </Button>
          )
        }
      />
      <SheetContent side="right" className="flex h-dvh flex-col gap-0 p-0">
        <SheetHeader className="border-border border-b px-6 py-5">
          <SheetTitle>Ask Fathom</SheetTitle>
          <SheetDescription>
            Search your processed calls and get answers from transcripts.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
          {chatMounted ? (
            <MeetingAskFathomPanel
              meetingId={meetingId}
              disabledReason={disabledReason}
              showIntro={false}
              starterQuestions={LIBRARY_STARTER_QUESTIONS}
              className="min-h-0 flex-1"
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { MeetingAskFathomSheet }
