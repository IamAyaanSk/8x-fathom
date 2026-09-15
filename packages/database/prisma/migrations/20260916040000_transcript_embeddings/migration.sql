ALTER TABLE "meeting" ADD COLUMN "transcriptEmbeddingsExtractedAt" TIMESTAMP(3);

ALTER TABLE "transcript_chunk" ALTER COLUMN "embedding" TYPE vector(1024);
