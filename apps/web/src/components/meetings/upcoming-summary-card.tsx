type UpcomingSummaryCardProps = {
  todayTotalCount: number
  todayUpcomingCount?: number
  todayCompletedCount: number
  tomorrowUpcomingCount: number
  totalUpcomingCount: number
}

function UpcomingSummaryCard({
  todayTotalCount,
  todayCompletedCount,
  tomorrowUpcomingCount,
  totalUpcomingCount
}: UpcomingSummaryCardProps) {
  return (
    <div className="bg-card border-border/70 flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-6 shadow-xs sm:p-7">
      <div className="flex flex-col gap-4">
        <div className="pb-1">
          <h3 className="text-foreground text-base font-semibold tracking-tight">
            Schedule Overview
          </h3>
        </div>

        <div className="divide-border/60 flex flex-col divide-y">
          <div className="flex items-center justify-between py-2.5 first:pt-0">
            <span className="text-muted-foreground text-sm font-medium">
              Today
            </span>
            <span className="text-foreground text-base font-semibold">
              {todayTotalCount}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground text-sm font-medium">
              Tomorrow
            </span>
            <span className="text-foreground text-base font-semibold">
              {tomorrowUpcomingCount}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-muted-foreground text-sm font-medium">
              Completed today
            </span>
            <span className="text-foreground text-base font-semibold">
              {todayCompletedCount}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 last:pb-0">
            <span className="text-muted-foreground text-sm font-medium">
              Total upcoming
            </span>
            <span className="text-foreground text-base font-semibold">
              {totalUpcomingCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export { UpcomingSummaryCard }
