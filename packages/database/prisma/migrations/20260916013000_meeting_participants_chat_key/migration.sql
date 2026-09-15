-- AlterTable
ALTER TABLE "meeting" ADD COLUMN "chatMessagesR2Key" TEXT;

-- CreateTable
CREATE TABLE "meeting_participant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baasUserId" INTEGER,
    "displayName" TEXT,
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_participant_meetingId_idx" ON "meeting_participant"("meetingId");

-- AddForeignKey
ALTER TABLE "meeting_participant" ADD CONSTRAINT "meeting_participant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
