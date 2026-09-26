import {
  calendarQueryKeys,
  useCalendarStatusQuery,
  useCalendarSyncMutation
} from '@repo/api-client/v1/calendar/hooks'
import { meetingsQueryKeys } from '@repo/api-client/v1/meetings/hooks'
import type { GetCalendarStatusResponse } from '@repo/api-contract/v1/calendar'
import { Button } from '@repo/ui-web/components/button'
import { cn } from '@repo/ui-web/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { type ComponentProps, useEffect, useState } from 'react'

type CalendarSyncButtonProps = {
  variant?: ComponentProps<typeof Button>['variant']
  size?: ComponentProps<typeof Button>['size']
  className?: string
  showText?: boolean
  label?: string
  onSynced?: (syncedCount: number) => void
  iconOnly?: boolean
  showSyncedTime?: boolean
  syncedTimePosition?: 'left' | 'right'
}

function formatSyncedLabel(
  lastSyncedAt: string | null | undefined,
  isPending: boolean
): string {
  if (isPending) {
    return 'Syncing…'
  }
  if (!lastSyncedAt) {
    return 'Synced recently'
  }

  const date = new Date(lastSyncedAt)
  const timeMs = date.getTime()
  if (Number.isNaN(timeMs)) {
    return 'Synced recently'
  }

  const diffMs = Date.now() - timeMs
  if (diffMs < 0) {
    return 'Synced just now'
  }

  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) {
    return 'Synced just now'
  }

  const diffMins = Math.floor(diffSec / 60)
  if (diffMins < 60) {
    return `Synced ${diffMins}m ago`
  }

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) {
    return `Synced ${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return 'Synced yesterday'
  }
  if (diffDays < 7) {
    return `Synced ${diffDays}d ago`
  }

  return 'Synced recently'
}

function formatSyncedTooltip(
  lastSyncedAt: string | null | undefined,
  isPending: boolean
): string {
  if (isPending) {
    return 'Syncing calendar with Google…'
  }
  if (!lastSyncedAt) {
    return 'Synced recently'
  }
  const date = new Date(lastSyncedAt)
  if (Number.isNaN(date.getTime())) {
    return 'Synced recently'
  }
  return `Last synced: ${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)}`
}

function CalendarSyncButton({
  variant,
  size,
  className,
  showText = true,
  label = 'Sync now',
  onSynced,
  iconOnly = false,
  showSyncedTime = false,
  syncedTimePosition = 'right'
}: CalendarSyncButtonProps) {
  const queryClient = useQueryClient()
  const { data: statusData } = useCalendarStatusQuery()
  const connected = statusData?.success === true && statusData.data.connected
  const lastSyncedAt =
    statusData?.success === true ? statusData.data.lastSyncedAt : null

  const [, setTick] = useState(0)

  useEffect(() => {
    if (!showSyncedTime) return
    const timer = setInterval(() => {
      setTick((prev) => prev + 1)
    }, 30_000)
    return () => clearInterval(timer)
  }, [showSyncedTime])

  const syncMutation = useCalendarSyncMutation({
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: meetingsQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all })
      if (response.success && response.data.lastSyncedAt) {
        queryClient.setQueryData<GetCalendarStatusResponse>(
          calendarQueryKeys.status(),
          (old) => {
            if (!old || !old.success) return old
            return {
              ...old,
              data: {
                ...old.data,
                lastSyncedAt: response.data.lastSyncedAt
              }
            }
          }
        )
      }
      if (response.success && onSynced) {
        onSynced(response.data.syncedCount)
      }
    }
  })

  const isPending = syncMutation.isPending
  const isDisabled = !connected || isPending

  const syncLabel = isPending ? 'Syncing…' : label

  const resolvedVariant = iconOnly
    ? (variant ?? 'ghost')
    : (variant ?? 'outline')
  const resolvedSize = iconOnly ? (size ?? 'icon-sm') : (size ?? 'sm')

  const buttonElement = (
    <Button
      type="button"
      variant={resolvedVariant}
      size={resolvedSize}
      disabled={isDisabled}
      onClick={() => {
        syncMutation.reset()
        syncMutation.mutate()
      }}
      className={cn(
        iconOnly
          ? 'text-muted-foreground hover:text-foreground hover:bg-muted/60 size-8 rounded-full transition-colors disabled:opacity-50'
          : 'shrink-0 gap-1.5',
        className
      )}
    >
      <RefreshCw
        className={cn(
          'size-3.5 transition-transform duration-500',
          !iconOnly && 'text-muted-foreground group-hover:text-foreground',
          isPending && 'animate-spin text-foreground'
        )}
      />
      {!iconOnly && showText ? (
        <span>{syncLabel}</span>
      ) : (
        <span className="sr-only">Sync calendar</span>
      )}
    </Button>
  )

  const wrappedButton = iconOnly ? (
    <span className="inline-flex">{buttonElement}</span>
  ) : (
    buttonElement
  )

  if (showSyncedTime) {
    const syncedLabel = formatSyncedLabel(lastSyncedAt, isPending)
    const syncedTooltip = formatSyncedTooltip(lastSyncedAt, isPending)

    const syncedTextElement = (
      <span
        className={cn(
          'hidden text-[10px] font-semibold tabular-nums select-none sm:inline',
          isPending && 'text-muted-foreground'
        )}
        title={syncedTooltip}
      >
        {syncedLabel}
      </span>
    )

    return (
      <div className="flex items-center">
        {syncedTimePosition === 'left' ? (
          <>
            {syncedTextElement}
            {wrappedButton}
          </>
        ) : (
          <>
            {wrappedButton}
            {syncedTextElement}
          </>
        )}
      </div>
    )
  }

  return wrappedButton
}

export { CalendarSyncButton }
