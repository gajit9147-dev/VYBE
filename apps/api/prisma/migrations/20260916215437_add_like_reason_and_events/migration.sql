-- CreateEnum
CREATE TYPE "InteractionReasonType" AS ENUM ('SHARED_INTEREST', 'SHARED_ANSWER', 'RELATIONSHIP_INTENT', 'PROFILE_PROMPT', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DiscoveryEventType" ADD VALUE 'LIKE';
ALTER TYPE "DiscoveryEventType" ADD VALUE 'PASS';
ALTER TYPE "DiscoveryEventType" ADD VALUE 'UNLIKE';
ALTER TYPE "DiscoveryEventType" ADD VALUE 'UNPASS';

-- AlterTable
ALTER TABLE "profile_interactions" ADD COLUMN     "reason_type" "InteractionReasonType",
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
