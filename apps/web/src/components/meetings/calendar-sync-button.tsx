import {
  useCalendarStatusQuery,
  useCalendarSyncMutation
} from '@repo/api-client/v1/calendar/hooks'
import { meetingsQueryKeys } from '@repo/api-client/v1/meetings/hooks'
import { Button } from '@repo/ui-web/components/button'
import { cn } from '@repo/ui-web/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw } from 'lucide-react'
import type { ComponentProps } from 'react'

type CalendarSyncButtonProps = {
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
  className?: string
  showText?: boolean
  label?: string
  onSynced?: (syncedCount: number) => void
}

function CalendarSyncButton({
  variant = 'outline',
  size = 'sm',
  className,
  showText = true,
  label = 'Sync now',
  onSynced
}: CalendarSyncButtonProps) {
  const queryClient = useQueryClient()
  const { data: statusData } = useCalendarStatusQuery()
  const connected = statusData?.success === true && statusData.data.connected

  const syncMutation = useCalendarSyncMutation({
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: meetingsQueryKeys.all })
      if (response.success && onSynced) {
        onSynced(response.data.syncedCount)
      }
    }
  })

  const isPending = syncMutation.isPending
  const isDisabled = !connected || isPending

  const syncLabel = isPending ? 'Syncing…' : label

  const title = !connected
    ? 'Connect Google Calendar first'
    : isPending
      ? 'Syncing calendar…'
      : 'Sync Google Calendar now'

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isDisabled}
      onClick={() => {
        syncMutation.reset()
        syncMutation.mutate()
      }}
      title={title}
      className={cn('shrink-0 gap-1.5', className)}
    >
      {isPending ? (
        <Loader2 className="text-primary size-3.5 animate-spin" />
      ) : (
        <RefreshCw className="text-muted-foreground group-hover:text-foreground size-3.5" />
      )}
      {showText ? (
        <span>{syncLabel}</span>
      ) : (
        <span className="sr-only">Sync calendar</span>
      )}
    </Button>
  )
}

export { CalendarSyncButton }
