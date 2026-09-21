import { runPendingMeetingProcessing } from '#src/process-pending-meetings'

async function runPendingProcessingTick() {
  try {
    const { pickedCount } = await runPendingMeetingProcessing()
    if (pickedCount === 0) {
      return
    }
    console.log(
      `Pending processing: picked ${pickedCount} meeting${pickedCount === 1 ? '' : 's'}`
    )
  } catch (error) {
    console.error('Pending processing tick failed', error)
  }
}

export { runPendingProcessingTick }
