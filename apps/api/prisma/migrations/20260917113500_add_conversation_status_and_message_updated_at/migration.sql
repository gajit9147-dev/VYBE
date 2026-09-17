-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");
