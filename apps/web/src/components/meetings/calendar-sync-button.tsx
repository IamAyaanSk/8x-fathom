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
  onSynced?: (syncedCount: number) => void
}

function CalendarSyncButton({
  variant = 'outline',
  size = 'sm',
  className,
  showText = true,
  onSynced
}: CalendarSyncButtonProps) {
  const queryClient = useQueryClient()
  const { data: statusData } = useCalendarStatusQuery()
  const connected =
    statusData?.success === true && statusData.data.connected

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
      title={
        !connected
          ? 'Connect Google Calendar first'
          : isPending
            ? 'Syncing calendar…'
            : 'Sync Google Calendar now'
      }
      className={cn('shrink-0 gap-1.5', className)}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin text-primary" />
      ) : (
        <RefreshCw className="size-4" />
      )}
      {showText ? (
        <span>{isPending ? 'Syncing…' : 'Sync now'}</span>
      ) : (
        <span className="sr-only">Sync calendar</span>
      )}
    </Button>
  )
}

export { CalendarSyncButton }
