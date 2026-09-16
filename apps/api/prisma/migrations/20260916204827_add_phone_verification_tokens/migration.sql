-- CreateTable
CREATE TABLE "phone_verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "otp_hash" VARCHAR(64) NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "max_attempts" SMALLINT NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phone_verification_tokens_user_id_expires_at_idx" ON "phone_verification_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "phone_verification_tokens_phone_number_expires_at_idx" ON "phone_verification_tokens"("phone_number", "expires_at");

-- AddForeignKey
ALTER TABLE "phone_verification_tokens" ADD CONSTRAINT "phone_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
