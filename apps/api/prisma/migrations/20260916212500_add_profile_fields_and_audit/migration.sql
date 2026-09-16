-- AlterTable
ALTER TABLE "profiles"
  ADD COLUMN "display_name" VARCHAR(50),
  ADD COLUMN "username" VARCHAR(30),
  ADD COLUMN "city" VARCHAR(100),
  ADD COLUMN "country" VARCHAR(100),
  ADD COLUMN "is_discoverable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "show_age" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "show_distance" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "crossed_path_opt_in" BOOLEAN NOT NULL DEFAULT true,
  ALTER COLUMN "first_name" DROP NOT NULL;

-- Backfill display_name for existing records if any
UPDATE "profiles" SET "display_name" = COALESCE("first_name", 'Member') WHERE "display_name" IS NULL;

-- Set NOT NULL on display_name now that any rows are backfilled
ALTER TABLE "profiles" ALTER COLUMN "display_name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");
CREATE INDEX "profiles_username_idx" ON "profiles"("username");

-- CreateTable
CREATE TABLE "profile_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "field" VARCHAR(64) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_audit_logs_user_id_created_at_idx" ON "profile_audit_logs"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "profile_audit_logs" ADD CONSTRAINT "profile_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
