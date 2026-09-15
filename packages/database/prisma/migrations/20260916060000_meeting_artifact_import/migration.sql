-- AlterEnum
ALTER TYPE "ProcessingStatus" ADD VALUE 'importing';

-- AlterTable
ALTER TABLE "meeting" ADD COLUMN "baasSignedArtifactUrls" JSONB;
ALTER TABLE "meeting" ADD COLUMN "artifactsImportedAt" TIMESTAMP(3);
