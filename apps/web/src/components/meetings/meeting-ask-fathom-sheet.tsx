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
import { useState } from 'react'

import { MeetingAskFathomPanel } from '#components/meetings/meeting-ask-fathom-panel'

type MeetingAskFathomSheetProps = {
  assistantApiUrl: string
  disabledReason?: string
  triggerClassName?: string
}

function MeetingAskFathomSheet({
  assistantApiUrl,
  disabledReason,
  triggerClassName
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
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            title={disabledReason}
            className={cn('shrink-0', triggerClassName)}
          />
        }
      >
        <Sparkles aria-hidden />
        Ask Fathom
      </SheetTrigger>
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
              assistantApiUrl={assistantApiUrl}
              disabledReason={disabledReason}
              showIntro={false}
              className="min-h-0 flex-1"
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { MeetingAskFathomSheet }
