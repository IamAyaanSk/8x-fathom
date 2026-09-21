import { SUMMARY_TEMPLATE_GROUPS } from '@repo/shared-utils/constants'
import { summaryTemplateLabel } from '@repo/shared-utils/summary'
import type { SummaryTemplateId } from '@repo/shared-validations/summary'
import { Button } from '@repo/ui-web/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui-web/components/dialog'
import { Label } from '@repo/ui-web/components/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@repo/ui-web/components/select'
import { Textarea } from '@repo/ui-web/components/textarea'
import { Loader2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

type MeetingRecreateSummarySubmit = {
  template: SummaryTemplateId
  detail?: string
}

type MeetingRecreateSummaryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  errorMessage: string | null
  onSubmit: (payload: MeetingRecreateSummarySubmit) => void
}

function MeetingRecreateSummaryDialog({
  open,
  onOpenChange,
  isPending,
  errorMessage,
  onSubmit
}: MeetingRecreateSummaryDialogProps) {
  const [templateId, setTemplateId] = useState<SummaryTemplateId>('enhanced')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    if (!open) {
      setTemplateId('enhanced')
      setDetail('')
    }
  }, [open])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = detail.trim()
    onSubmit({
      template: templateId,
      ...(trimmed.length > 0 ? { detail: trimmed } : {})
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Recreate summary</DialogTitle>
            <DialogDescription>
              Pick a template and optionally add instructions. Your current
              summary will be replaced.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="summary-template">Template</Label>
              <Select
                value={templateId}
                onValueChange={(value) => {
                  if (value !== null) {
                    setTemplateId(value as SummaryTemplateId)
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger id="summary-template" className="w-full">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(20rem,60vh)]">
                  {SUMMARY_TEMPLATE_GROUPS.map((group, groupIndex) => (
                    <SelectGroup key={group.label}>
                      {groupIndex > 0 ? <SelectSeparator /> : null}
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.templateIds.map((id) => (
                        <SelectItem key={id} value={id}>
                          {summaryTemplateLabel(id)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="summary-additional-detail">
                Additional instructions{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="summary-additional-detail"
                value={detail}
                onChange={(event) => {
                  setDetail(event.target.value)
                }}
                placeholder="e.g. Focus on pricing objections and next steps for the legal review."
                maxLength={4000}
                rows={4}
                disabled={isPending}
              />
            </div>

            {errorMessage ? (
              <p className="text-destructive text-sm" role="alert">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                  Recreating…
                </>
              ) : (
                'Recreate summary'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { MeetingRecreateSummaryDialog }
export type { MeetingRecreateSummarySubmit }
