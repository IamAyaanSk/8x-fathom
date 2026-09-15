-- DropForeignKey
ALTER TABLE "meeting" DROP CONSTRAINT "meeting_calendarEventId_fkey";

-- AlterTable: add calendar fields (nullable during backfill)
ALTER TABLE "meeting" ADD COLUMN "googleEventId" TEXT,
ADD COLUMN "title" TEXT,
ADD COLUMN "startTime" TIMESTAMP(3),
ADD COLUMN "endTime" TIMESTAMP(3),
ADD COLUMN "meetingUrl" TEXT,
ADD COLUMN "htmlLink" TEXT;

-- Backfill from linked calendar_event rows
UPDATE "meeting" AS m
SET
  "googleEventId" = ce."googleEventId",
  "title" = ce."title",
  "startTime" = ce."startTime",
  "endTime" = ce."endTime",
  "meetingUrl" = ce."meetingUrl",
  "htmlLink" = ce."htmlLink"
FROM "calendar_event" AS ce
WHERE m."calendarEventId" = ce."id";

-- Create meetings for eligible calendar events that never had a meeting row
INSERT INTO "meeting" (
  "id",
  "userId",
  "googleEventId",
  "title",
  "startTime",
  "endTime",
  "meetingUrl",
  "htmlLink",
  "processingStatus",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  ce."userId",
  ce."googleEventId",
  ce."title",
  ce."startTime",
  ce."endTime",
  ce."meetingUrl",
  ce."htmlLink",
  'idle',
  ce."createdAt",
  ce."updatedAt"
FROM "calendar_event" AS ce
WHERE ce."meetingUrl" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "meeting" AS m WHERE m."googleEventId" = ce."googleEventId"
  );

-- Drop rows that could not be backfilled (no meeting URL on linked event)
DELETE FROM "meeting"
WHERE "googleEventId" IS NULL;

-- DropIndex
DROP INDEX "meeting_calendarEventId_key";

-- AlterTable
ALTER TABLE "meeting" DROP COLUMN "calendarEventId",
ALTER COLUMN "googleEventId" SET NOT NULL,
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "startTime" SET NOT NULL,
ALTER COLUMN "endTime" SET NOT NULL,
ALTER COLUMN "meetingUrl" SET NOT NULL;

-- DropTable
DROP TABLE "calendar_event";

-- CreateIndex
CREATE UNIQUE INDEX "meeting_googleEventId_key" ON "meeting"("googleEventId");

-- CreateIndex
CREATE INDEX "meeting_userId_startTime_idx" ON "meeting"("userId", "startTime");
