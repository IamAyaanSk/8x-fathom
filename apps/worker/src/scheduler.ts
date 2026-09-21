import { runImportingMeetingArtifacts } from '#src/process-importing-meetings'
import { runPendingMeetingProcessing } from '#src/process-pending-meetings'

async function runArtifactImportTick() {
  try {
    const { pickedCount } = await runImportingMeetingArtifacts()
    if (pickedCount === 0) {
      return
    }
    console.log(
      `Artifact import: picked ${pickedCount} meeting${pickedCount === 1 ? '' : 's'}`
    )
  } catch (error) {
    console.error('Artifact import tick failed', error)
  }
}

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

export { runArtifactImportTick, runPendingProcessingTick }
