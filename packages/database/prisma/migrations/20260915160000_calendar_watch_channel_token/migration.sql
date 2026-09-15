-- AlterTable
ALTER TABLE "calendar_watch" ADD COLUMN "channelToken" TEXT NOT NULL DEFAULT '';

-- Remove default after backfill (no existing rows expected in dev)
ALTER TABLE "calendar_watch" ALTER COLUMN "channelToken" DROP DEFAULT;
