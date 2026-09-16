/*
  Warnings:

  - You are about to drop the column `crossed_paths_recorded` on the `match_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `explanation_chips` on the `match_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `lifestyle_alignment_score` on the `match_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `shared_intent_key` on the `match_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `shared_interests_count` on the `match_reasons` table. All the data in the column will be lost.
  - You are about to drop the column `values_alignment_score` on the `match_reasons` table. All the data in the column will be lost.
  - Added the required column `text` to the `match_reasons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `match_reasons` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchReasonType" AS ENUM ('SHARED_INTEREST', 'SHARED_ANSWER', 'RELATIONSHIP_INTENT', 'PREFERENCE_ALIGNMENT', 'PROFILE_SIGNAL');

-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('MATCH_CREATED', 'MATCH_UNMATCHED');

-- DropIndex
DROP INDEX "match_reasons_match_id_key";

-- AlterTable
ALTER TABLE "match_reasons" DROP COLUMN "crossed_paths_recorded",
DROP COLUMN "explanation_chips",
DROP COLUMN "lifestyle_alignment_score",
DROP COLUMN "shared_intent_key",
DROP COLUMN "shared_interests_count",
DROP COLUMN "values_alignment_score",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "text" VARCHAR(255) NOT NULL,
ADD COLUMN     "type" "MatchReasonType" NOT NULL;

-- CreateTable
CREATE TABLE "match_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "type" "MatchEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_events_match_id_idx" ON "match_events"("match_id");

-- CreateIndex
CREATE INDEX "match_events_actor_user_id_idx" ON "match_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "match_events_created_at_idx" ON "match_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "match_reasons_match_id_idx" ON "match_reasons"("match_id");

-- CreateIndex
CREATE INDEX "match_reasons_type_idx" ON "match_reasons"("type");

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
