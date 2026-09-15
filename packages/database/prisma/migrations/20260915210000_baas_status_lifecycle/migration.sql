UPDATE "meeting"
SET "processingStatus" = 'pending'
WHERE "baasStatus"::text = 'completed'
  AND "processingStatus" = 'idle';

ALTER TABLE "meeting" ALTER COLUMN "baasStatus" DROP DEFAULT;

ALTER TABLE "meeting"
  ALTER COLUMN "baasStatus" TYPE TEXT
  USING (
    CASE "baasStatus"::text
      WHEN 'queued' THEN 'joining'
      WHEN 'pickup_delayed' THEN 'joining'
      WHEN 'awaiting_reconciliation' THEN 'joining'
      WHEN 'joining_call' THEN 'joining'
      WHEN 'in_waiting_room' THEN 'in_waiting_room'
      WHEN 'in_waiting_for_host' THEN 'in_waiting_room'
      WHEN 'in_call_recording' THEN 'in_call_recording'
      WHEN 'recording_paused' THEN 'in_call_recording'
      WHEN 'recording_resumed' THEN 'in_call_recording'
      WHEN 'in_call_not_recording' THEN 'in_call_recording'
      WHEN 'call_ended' THEN 'transcribing'
      WHEN 'recording_succeeded' THEN 'transcribing'
      WHEN 'transcribing' THEN 'transcribing'
      WHEN 'completed' THEN 'transcribing'
      WHEN 'api_request_stop' THEN 'transcribing'
      WHEN 'failed' THEN 'failed'
      WHEN 'bot_rejected' THEN 'failed'
      WHEN 'bot_removed' THEN 'failed'
      WHEN 'bot_removed_too_early' THEN 'failed'
      WHEN 'waiting_room_timeout' THEN 'failed'
      WHEN 'invalid_meeting_url' THEN 'failed'
      WHEN 'meeting_error' THEN 'failed'
      WHEN 'transcription_failed' THEN 'failed'
      WHEN 'recording_failed' THEN 'failed'
      WHEN 'MEET_LOGIN_UNAVAILABLE' THEN 'failed'
      WHEN 'MEET_LOGIN_REQUIRED' THEN 'failed'
      WHEN 'MEET_LOGIN_FAILED_SAML_REJECTED' THEN 'failed'
      WHEN 'MEET_LOGIN_FAILED_TIMEOUT' THEN 'failed'
      ELSE CASE WHEN "baasStatus" IS NULL THEN NULL ELSE 'failed' END
    END
  );

DROP TYPE "BaasBotStatus" CASCADE;

CREATE TYPE "BaasBotStatus" AS ENUM (
  'joining',
  'in_waiting_room',
  'in_call_recording',
  'transcribing',
  'failed'
);

ALTER TABLE "meeting"
  ALTER COLUMN "baasStatus" TYPE "BaasBotStatus"
  USING "baasStatus"::"BaasBotStatus";
