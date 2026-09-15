-- CreateEnum
CREATE TYPE "BaasBotStatus" AS ENUM ('queued', 'pickup_delayed', 'joining_call', 'in_waiting_room', 'in_waiting_for_host', 'in_call_recording', 'recording_resumed', 'in_call_not_recording', 'call_ended', 'recording_succeeded', 'transcribing', 'completed', 'bot_rejected', 'invalid_meeting_url', 'meeting_error', 'waiting_room_timeout', 'bot_removed_too_early', 'meet_login_error', 'failed', 'transcription_failed', 'recording_failed');

-- DropForeignKey
ALTER TABLE "ActionItem" DROP CONSTRAINT "ActionItem_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarWatch" DROP CONSTRAINT "CalendarWatch_userId_fkey";

-- DropForeignKey
ALTER TABLE "Highlight" DROP CONSTRAINT "Highlight_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_calendarEventId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_userId_fkey";

-- DropForeignKey
ALTER TABLE "TranscriptChunk" DROP CONSTRAINT "TranscriptChunk_meetingId_fkey";

-- DropTable
DROP TABLE "ActionItem";

-- DropTable
DROP TABLE "CalendarEvent";

-- DropTable
DROP TABLE "CalendarWatch";

-- DropTable
DROP TABLE "Highlight";

-- DropTable
DROP TABLE "Meeting";

-- DropTable
DROP TABLE "TranscriptChunk";

-- CreateTable
CREATE TABLE "calendar_watch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "syncToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_watch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT,
    "htmlLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarEventId" TEXT NOT NULL,
    "baasBotId" TEXT,
    "baasStatus" "BaasBotStatus",
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'idle',
    "shareSlug" TEXT,
    "recordingR2Key" TEXT,
    "transcriptR2Key" TEXT,
    "recordingStartedAt" TIMESTAMP(3),
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "highlight" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "timestampSec" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scratchpad_entry" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "timestampSec" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scratchpad_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_item" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestampSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_chunk" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "startSec" INTEGER NOT NULL,
    "endSec" INTEGER NOT NULL,
    "speaker" TEXT,
    "text" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcript_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_watch_userId_key" ON "calendar_watch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_googleEventId_key" ON "calendar_event"("googleEventId");

-- CreateIndex
CREATE INDEX "calendar_event_userId_idx" ON "calendar_event"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_calendarEventId_key" ON "meeting"("calendarEventId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_shareSlug_key" ON "meeting"("shareSlug");

-- CreateIndex
CREATE INDEX "meeting_userId_idx" ON "meeting"("userId");

-- CreateIndex
CREATE INDEX "meeting_processingStatus_idx" ON "meeting"("processingStatus");

-- CreateIndex
CREATE INDEX "highlight_meetingId_idx" ON "highlight"("meetingId");

-- CreateIndex
CREATE INDEX "scratchpad_entry_meetingId_idx" ON "scratchpad_entry"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "scratchpad_entry_meetingId_timestampSec_key" ON "scratchpad_entry"("meetingId", "timestampSec");

-- CreateIndex
CREATE INDEX "action_item_meetingId_idx" ON "action_item"("meetingId");

-- CreateIndex
CREATE INDEX "transcript_chunk_meetingId_idx" ON "transcript_chunk"("meetingId");

-- AddForeignKey
ALTER TABLE "calendar_watch" ADD CONSTRAINT "calendar_watch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "highlight" ADD CONSTRAINT "highlight_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scratchpad_entry" ADD CONSTRAINT "scratchpad_entry_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_item" ADD CONSTRAINT "action_item_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_chunk" ADD CONSTRAINT "transcript_chunk_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
