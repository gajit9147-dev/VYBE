-- CreateEnum
CREATE TYPE "DiscoveryEventType" AS ENUM ('VIEW', 'SKIP', 'OPEN_PROFILE', 'REPORT', 'BLOCK', 'OTHER');

-- CreateTable
CREATE TABLE "discovery_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "candidate_user_id" UUID NOT NULL,
    "event_type" "DiscoveryEventType" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discovery_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discovery_events_user_id_candidate_user_id_event_type_idx" ON "discovery_events"("user_id", "candidate_user_id", "event_type");

-- CreateIndex
CREATE INDEX "discovery_events_user_id_created_at_idx" ON "discovery_events"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "discovery_events" ADD CONSTRAINT "discovery_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_events" ADD CONSTRAINT "discovery_events_candidate_user_id_fkey" FOREIGN KEY ("candidate_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
