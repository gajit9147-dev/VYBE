-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('VALUES', 'LIFESTYLE', 'PERSONALITY', 'RELATIONSHIPS', 'FUN', 'DEEP', 'DAILY_LIFE');

-- CreateEnum
CREATE TYPE "AnswerVisibility" AS ENUM ('PUBLIC', 'DISCOVERY', 'MATCHES_ONLY', 'PRIVATE');

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_text" TEXT NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_question_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "visibility" "AnswerVisibility" NOT NULL DEFAULT 'PUBLIC',
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_question_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questions_is_active_category_display_order_idx" ON "questions"("is_active", "category", "display_order");

-- CreateIndex
CREATE INDEX "user_question_answers_question_id_idx" ON "user_question_answers"("question_id");

-- CreateIndex
CREATE INDEX "user_question_answers_user_id_idx" ON "user_question_answers"("user_id");

-- CreateIndex
CREATE INDEX "user_question_answers_visibility_idx" ON "user_question_answers"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "user_question_answers_user_id_question_id_key" ON "user_question_answers"("user_id", "question_id");

-- AddForeignKey
ALTER TABLE "user_question_answers" ADD CONSTRAINT "user_question_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_question_answers" ADD CONSTRAINT "user_question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
