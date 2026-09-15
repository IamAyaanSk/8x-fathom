-- CreateTable
CREATE TABLE "meeting_chat_message" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "baasMessageId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "baasSenderId" INTEGER,
    "text" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_chat_message_meetingId_idx" ON "meeting_chat_message"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_chat_message_meetingId_sentAt_idx" ON "meeting_chat_message"("meetingId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_chat_message_meetingId_baasMessageId_key" ON "meeting_chat_message"("meetingId", "baasMessageId");

-- AddForeignKey
ALTER TABLE "meeting_chat_message" ADD CONSTRAINT "meeting_chat_message_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
