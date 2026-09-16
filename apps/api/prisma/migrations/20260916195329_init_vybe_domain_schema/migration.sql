-- Ensure Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_ONBOARDING', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'COMMUNITY_CREATOR', 'TESTER');

-- CreateEnum
CREATE TYPE "IdentityProvider" AS ENUM ('APPLE', 'GOOGLE', 'PHONE_OTP');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('DARK', 'LIGHT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'PRECISE_LOCATION', 'BIOMETRIC_VERIFICATION', 'DATA_PROCESSING');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('WOMAN', 'MAN', 'NON_BINARY', 'GENDERQUEER', 'OTHER');

-- CreateEnum
CREATE TYPE "DrinkingFrequency" AS ENUM ('NEVER', 'SOCIALLY', 'REGULARLY', 'SOBER');

-- CreateEnum
CREATE TYPE "SmokingFrequency" AS ENUM ('NEVER', 'SOCIALLY', 'REGULARLY');

-- CreateEnum
CREATE TYPE "ExerciseFrequency" AS ENUM ('DAILY', 'OFTEN', 'SOMETIMES', 'RARELY');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "PromptCategory" AS ENUM ('VALUES', 'DATE_IDEAS', 'HUMOR', 'LIFESTYLE');

-- CreateEnum
CREATE TYPE "CompatibilityDimension" AS ENUM ('COMMUNICATION', 'VALUES', 'LIFESTYLE', 'ROMANCE', 'FINANCIAL');

-- CreateEnum
CREATE TYPE "QuestionImportance" AS ENUM ('IRRELEVANT', 'SOMEWHAT', 'VERY', 'DEALBREAKER');

-- CreateEnum
CREATE TYPE "InteractionAction" AS ENUM ('LIKE', 'PASS', 'SUPER_LIKE');

-- CreateEnum
CREATE TYPE "TargetElementType" AS ENUM ('PHOTO', 'PROMPT', 'BIO', 'PROFILE');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('ACTIVE', 'UNMATCHED', 'BLOCKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'MEDIA', 'VOICE_NOTE', 'DATE_INVITE', 'SAFETY_PROMPT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageDeliveryStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "MessageMediaType" AS ENUM ('IMAGE', 'AUDIO_NOTE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ModerationScanResult" AS ENUM ('SAFE', 'NSFW_BLURRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_MATCH', 'MESSAGE_RECEIVED', 'LIKE_RECEIVED', 'DATE_SAFETY_REMINDER', 'CROSSED_PATHS', 'SYSTEM_NOTICE');

-- CreateEnum
CREATE TYPE "BlockReasonCode" AS ENUM ('HARASSMENT', 'SAFETY', 'PERSONAL_CHOICE', 'KNOWN_OFFLINE');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FAKE_PROFILE', 'OFFLINE_SAFETY', 'SCAM_SPAM', 'UNDERAGE');

-- CreateEnum
CREATE TYPE "ReportContextType" AS ENUM ('PROFILE', 'MESSAGE', 'PHOTO', 'DATE_INCIDENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ModerationCaseStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARNING', 'PHOTO_REMOVAL', 'SHADOWBAN', 'SUSPENSION', 'PERMANENT_BAN', 'DEVICE_BAN');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING_APPEAL', 'APPEAL_REJECTED', 'OVERTURNED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('SELFIE_LIVENESS', 'GOV_ID', 'PHONE_CARRIER', 'OFFICIAL_BADGE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationProvider" AS ENUM ('PERSONA', 'VERIFF', 'INTERNAL_OPERATOR');

-- CreateEnum
CREATE TYPE "SafetyCheckinStatus" AS ENUM ('SCHEDULED', 'CONFIRMED_SAFE', 'SNOOZED', 'TRIGGERED_ALERT');

-- CreateEnum
CREATE TYPE "ContactRelationshipType" AS ENUM ('FRIEND', 'FAMILY', 'ROOMMATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DatePlanStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmergencyTriggerType" AS ENUM ('PANIC_BUTTON', 'DURESS_PIN_ENTERED', 'MISSED_SAFETY_CHECKIN', 'MANUAL_SOS');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('TRIGGERED', 'CONTACTS_NOTIFIED', 'ESCALATED_TO_AUTHORITIES', 'RESOLVED_FALSE_ALARM', 'RESOLVED_SAFE');

-- CreateEnum
CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('APPLE_IAP', 'GOOGLE_PLAY', 'STRIPE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" VARCHAR(20),
    "email" VARCHAR(255),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_credentials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "password_algo" VARCHAR(32) NOT NULL DEFAULT 'argon2id',
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "provider" "IdentityProvider" NOT NULL,
    "provider_subject" VARCHAR(255) NOT NULL,
    "provider_email" VARCHAR(255),
    "last_authenticated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_auth" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "totp_secret_encrypted" TEXT,
    "recovery_codes_hash" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "two_factor_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(64) NOT NULL,
    "device_fingerprint" VARCHAR(128),
    "ip_hash" VARCHAR(64) NOT NULL,
    "user_agent" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "device_id" VARCHAR(128) NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "push_token" TEXT,
    "app_version" VARCHAR(32) NOT NULL,
    "os_version" VARCHAR(32),
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "is_discovery_paused" BOOLEAN NOT NULL DEFAULT false,
    "is_ghost_mode" BOOLEAN NOT NULL DEFAULT false,
    "notify_new_matches" BOOLEAN NOT NULL DEFAULT true,
    "notify_messages" BOOLEAN NOT NULL DEFAULT true,
    "notify_date_safety" BOOLEAN NOT NULL DEFAULT true,
    "notify_marketing" BOOLEAN NOT NULL DEFAULT false,
    "theme" "ThemePreference" NOT NULL DEFAULT 'DARK',
    "language" VARCHAR(10) NOT NULL DEFAULT 'en-US',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "policy_version" VARCHAR(24) NOT NULL,
    "is_granted" BOOLEAN NOT NULL,
    "ip_hash" VARCHAR(64) NOT NULL,
    "user_agent" TEXT,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "birth_date" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "pronouns" VARCHAR(32),
    "bio" TEXT,
    "height_cm" SMALLINT,
    "occupation" VARCHAR(100),
    "company" VARCHAR(100),
    "education" VARCHAR(100),
    "drinking" "DrinkingFrequency",
    "smoking" "SmokingFrequency",
    "exercise" "ExerciseFrequency",
    "star_sign" VARCHAR(20),
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completion_score" SMALLINT NOT NULL DEFAULT 0,
    "is_incognito" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "cdn_url" VARCHAR(512) NOT NULL,
    "display_order" SMALLINT NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "blurhash" VARCHAR(64),
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "profile_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" "PromptCategory" NOT NULL,
    "question" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_prompts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "answer_text" TEXT NOT NULL,
    "audio_storage_key" VARCHAR(255),
    "audio_duration_sec" SMALLINT,
    "display_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profile_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(64) NOT NULL,
    "icon_key" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interest_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_interests" (
    "profile_id" UUID NOT NULL,
    "interest_id" UUID NOT NULL,
    "rank" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_interests_pkey" PRIMARY KEY ("profile_id","interest_id")
);

-- CreateTable
CREATE TABLE "relationship_intents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "label" VARCHAR(64) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationship_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_relationship_intents" (
    "profile_id" UUID NOT NULL,
    "intent_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "custom_clarification" VARCHAR(150),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_relationship_intents_pkey" PRIMARY KEY ("profile_id","intent_id")
);

-- CreateTable
CREATE TABLE "discovery_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "min_age" SMALLINT NOT NULL DEFAULT 18,
    "max_age" SMALLINT NOT NULL DEFAULT 45,
    "is_age_dealbreaker" BOOLEAN NOT NULL DEFAULT true,
    "max_distance_km" SMALLINT NOT NULL DEFAULT 50,
    "is_distance_dealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "interested_in_genders" "Gender"[] DEFAULT ARRAY['WOMAN', 'MAN', 'NON_BINARY']::"Gender"[],
    "relationship_intent_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_intent_dealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "verified_profiles_only" BOOLEAN NOT NULL DEFAULT false,
    "has_bio_only" BOOLEAN NOT NULL DEFAULT false,
    "min_height_cm" SMALLINT,
    "max_height_cm" SMALLINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "discovery_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dimension" "CompatibilityDimension" NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compatibility_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "user_answer" VARCHAR(32) NOT NULL,
    "acceptable_partner_answers" TEXT[],
    "importance" "QuestionImportance" NOT NULL DEFAULT 'SOMEWHAT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "compatibility_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_interactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_user_id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "action" "InteractionAction" NOT NULL,
    "target_element_type" "TargetElementType",
    "target_element_id" UUID,
    "comment" TEXT,
    "is_consumed_by_match" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user1_id" UUID NOT NULL,
    "user2_id" UUID NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "matched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(6),
    "closed_by_user_id" UUID,
    "unmatch_reason_code" VARCHAR(48),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_reasons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "shared_intent_key" VARCHAR(32),
    "shared_interests_count" SMALLINT NOT NULL DEFAULT 0,
    "values_alignment_score" SMALLINT NOT NULL DEFAULT 0,
    "lifestyle_alignment_score" SMALLINT NOT NULL DEFAULT 0,
    "explanation_chips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "crossed_paths_recorded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "user1_id" UUID NOT NULL,
    "user2_id" UUID NOT NULL,
    "last_message_id" UUID,
    "last_message_at" TIMESTAMPTZ(6),
    "user1_last_read_at" TIMESTAMPTZ(6),
    "user2_last_read_at" TIMESTAMPTZ(6),
    "user1_muted_until" TIMESTAMPTZ(6),
    "user2_muted_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT,
    "reply_to_message_id" UUID,
    "delivery_status" "MessageDeliveryStatus" NOT NULL DEFAULT 'SENT',
    "sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "media_type" "MessageMediaType" NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "duration_seconds" SMALLINT,
    "blurhash" VARCHAR(64),
    "is_view_once" BOOLEAN NOT NULL DEFAULT false,
    "viewed_at" TIMESTAMPTZ(6),
    "moderation_scan_result" "ModerationScanResult" NOT NULL DEFAULT 'SAFE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "body" TEXT NOT NULL,
    "data_payload" JSONB NOT NULL DEFAULT '{}',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "is_pushed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_privacy_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "coarse_distance_only" BOOLEAN NOT NULL DEFAULT true,
    "hide_distance_entirely" BOOLEAN NOT NULL DEFAULT false,
    "share_city_name_only" BOOLEAN NOT NULL DEFAULT true,
    "crossed_paths_enabled" BOOLEAN NOT NULL DEFAULT true,
    "snooze_location_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "location_privacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "coarse_location" geography(Point, 4326) NOT NULL,
    "h3_index_res8" VARCHAR(15) NOT NULL,
    "city_name" VARCHAR(100),
    "country_code" VARCHAR(2),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crossed_paths" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user1_id" UUID NOT NULL,
    "user2_id" UUID NOT NULL,
    "encounter_cell_h3" VARCHAR(15) NOT NULL,
    "time_bucket" TIMESTAMPTZ(6) NOT NULL,
    "encounter_count" SMALLINT NOT NULL DEFAULT 1,
    "is_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "last_encountered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crossed_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_location_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date_plan_id" UUID,
    "access_token_hash" VARCHAR(64) NOT NULL,
    "latest_point" geography(Point, 4326),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "live_location_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "blocker_user_id" UUID NOT NULL,
    "blocked_user_id" UUID NOT NULL,
    "reason_code" "BlockReasonCode",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporter_user_id" UUID NOT NULL,
    "reported_user_id" UUID NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "context_type" "ReportContextType" NOT NULL,
    "context_reference_id" UUID,
    "description" TEXT,
    "evidence_media_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID,
    "target_user_id" UUID NOT NULL,
    "severity" "ModerationSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "ModerationCaseStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_moderator_id" UUID,
    "investigation_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "case_id" UUID,
    "target_user_id" UUID NOT NULL,
    "action_type" "ModerationActionType" NOT NULL,
    "reason_code" VARCHAR(48) NOT NULL,
    "internal_justification" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "performed_by_admin_id" UUID NOT NULL,
    "appeal_status" "AppealStatus",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "verification_type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "VerificationProvider" NOT NULL,
    "provider_inquiry_id" VARCHAR(128) NOT NULL,
    "rejection_reason" VARCHAR(128),
    "verified_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_checkins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date_plan_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "scheduled_time" TIMESTAMPTZ(6) NOT NULL,
    "grace_period_minutes" SMALLINT NOT NULL DEFAULT 15,
    "status" "SafetyCheckinStatus" NOT NULL DEFAULT 'SCHEDULED',
    "response_received_at" TIMESTAMPTZ(6),
    "safe_pin_hash" VARCHAR(255) NOT NULL,
    "duress_pin_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "safety_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trusted_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "contact_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "relationship_type" "ContactRelationshipType" NOT NULL,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trusted_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "creator_user_id" UUID NOT NULL,
    "venue_name" VARCHAR(150) NOT NULL,
    "venue_address" TEXT NOT NULL,
    "venue_location" geography(Point, 4326),
    "is_public_venue_verified" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time_estimate" TIMESTAMPTZ(6) NOT NULL,
    "status" "DatePlanStatus" NOT NULL DEFAULT 'PROPOSED',
    "share_with_trusted_contacts" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "date_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date_plan_id" UUID,
    "trigger_type" "EmergencyTriggerType" NOT NULL,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'TRIGGERED',
    "dispatch_location" geography(Point, 4326),
    "resolution_notes" TEXT,
    "resolved_by_admin_id" UUID,
    "triggered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "mfa_secret_encrypted" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(64) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "admin_user_roles" (
    "admin_user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by_admin_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_roles_pkey" PRIMARY KEY ("admin_user_id","role_id")
);

-- CreateTable
CREATE TABLE "admin_access_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_user_id" UUID NOT NULL,
    "permission_key" VARCHAR(64) NOT NULL,
    "target_user_id" UUID,
    "justification" TEXT NOT NULL,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by_admin_id" UUID,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_user_id" UUID NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "resource_type" VARCHAR(32) NOT NULL,
    "resource_id" VARCHAR(128) NOT NULL,
    "reason_provided" TEXT NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "diff_payload" JSONB,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "billing_interval" "BillingInterval" NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "features" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "payment_gateway" "PaymentGateway" NOT NULL,
    "external_subscription_id" VARCHAR(128) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "current_period_start" TIMESTAMPTZ(6) NOT NULL,
    "current_period_end" TIMESTAMPTZ(6) NOT NULL,
    "canceled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "external_transaction_id" VARCHAR(128) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL,
    "raw_receipt_url" VARCHAR(512),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(64) NOT NULL,
    "description" TEXT NOT NULL,
    "is_globally_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_percentage" SMALLINT NOT NULL DEFAULT 0,
    "targeting_rules" JSONB NOT NULL DEFAULT '{}',
    "updated_by_admin_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "anonymous_user_id" VARCHAR(64) NOT NULL,
    "event_name" VARCHAR(64) NOT NULL,
    "event_properties" JSONB NOT NULL DEFAULT '{}',
    "app_version" VARCHAR(32) NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "client_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "server_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_credentials_user_id_key" ON "auth_credentials"("user_id");

-- CreateIndex
CREATE INDEX "user_identities_user_id_idx" ON "user_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_provider_subject_key" ON "user_identities"("provider", "provider_subject");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_auth_user_id_key" ON "two_factor_auth"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_key" ON "user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_expires_at_idx" ON "user_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "user_devices_push_token_idx" ON "user_devices"("push_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "user_devices"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_consents_user_id_consent_type_granted_at_idx" ON "user_consents"("user_id", "consent_type", "granted_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_gender_idx" ON "profiles"("gender");

-- CreateIndex
CREATE INDEX "profiles_birth_date_idx" ON "profiles"("birth_date");

-- CreateIndex
CREATE INDEX "profiles_deleted_at_idx" ON "profiles"("deleted_at");

-- CreateIndex
CREATE INDEX "profile_photos_profile_id_display_order_idx" ON "profile_photos"("profile_id", "display_order");

-- CreateIndex
CREATE INDEX "profile_photos_moderation_status_idx" ON "profile_photos"("moderation_status");

-- CreateIndex
CREATE INDEX "prompt_templates_is_active_category_idx" ON "prompt_templates"("is_active", "category");

-- CreateIndex
CREATE INDEX "profile_prompts_profile_id_display_order_idx" ON "profile_prompts"("profile_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "profile_prompts_profile_id_template_id_key" ON "profile_prompts"("profile_id", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "interest_categories_name_key" ON "interest_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "interests_slug_key" ON "interests"("slug");

-- CreateIndex
CREATE INDEX "interests_slug_idx" ON "interests"("slug");

-- CreateIndex
CREATE INDEX "profile_interests_interest_id_profile_id_idx" ON "profile_interests"("interest_id", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_intents_code_key" ON "relationship_intents"("code");

-- CreateIndex
CREATE UNIQUE INDEX "discovery_preferences_user_id_key" ON "discovery_preferences"("user_id");

-- CreateIndex
CREATE INDEX "compatibility_questions_dimension_is_active_idx" ON "compatibility_questions"("dimension", "is_active");

-- CreateIndex
CREATE INDEX "compatibility_answers_user_id_question_id_idx" ON "compatibility_answers"("user_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "compatibility_answers_user_id_question_id_key" ON "compatibility_answers"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "profile_interactions_target_user_id_action_created_at_idx" ON "profile_interactions"("target_user_id", "action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "profile_interactions_actor_user_id_action_created_at_idx" ON "profile_interactions"("actor_user_id", "action", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "profile_interactions_actor_user_id_target_user_id_key" ON "profile_interactions"("actor_user_id", "target_user_id");

-- CreateIndex
CREATE INDEX "matches_user1_id_status_matched_at_idx" ON "matches"("user1_id", "status", "matched_at" DESC);

-- CreateIndex
CREATE INDEX "matches_user2_id_status_matched_at_idx" ON "matches"("user2_id", "status", "matched_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "matches_user1_id_user2_id_key" ON "matches"("user1_id", "user2_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_reasons_match_id_key" ON "match_reasons"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_match_id_key" ON "conversations"("match_id");

-- CreateIndex
CREATE INDEX "conversations_user1_id_last_message_at_idx" ON "conversations"("user1_id", "last_message_at" DESC);

-- CreateIndex
CREATE INDEX "conversations_user2_id_last_message_at_idx" ON "conversations"("user2_id", "last_message_at" DESC);

-- CreateIndex
CREATE INDEX "messages_conversation_id_sent_at_idx" ON "messages"("conversation_id", "sent_at" DESC);

-- CreateIndex
CREATE INDEX "messages_sender_id_sent_at_idx" ON "messages"("sender_id", "sent_at" DESC);

-- CreateIndex
CREATE INDEX "message_media_message_id_idx" ON "message_media"("message_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "location_privacy_settings_user_id_key" ON "location_privacy_settings"("user_id");

-- CreateIndex
CREATE INDEX "location_events_h3_index_res8_created_at_idx" ON "location_events"("h3_index_res8", "created_at" DESC);

-- CreateIndex
CREATE INDEX "location_events_expires_at_idx" ON "location_events"("expires_at");

-- CreateIndex
CREATE INDEX "crossed_paths_user1_id_last_encountered_at_idx" ON "crossed_paths"("user1_id", "last_encountered_at" DESC);

-- CreateIndex
CREATE INDEX "crossed_paths_user2_id_last_encountered_at_idx" ON "crossed_paths"("user2_id", "last_encountered_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "crossed_paths_user1_id_user2_id_time_bucket_key" ON "crossed_paths"("user1_id", "user2_id", "time_bucket");

-- CreateIndex
CREATE INDEX "live_location_shares_access_token_hash_idx" ON "live_location_shares"("access_token_hash");

-- CreateIndex
CREATE INDEX "user_blocks_blocker_user_id_blocked_user_id_idx" ON "user_blocks"("blocker_user_id", "blocked_user_id");

-- CreateIndex
CREATE INDEX "user_blocks_blocked_user_id_blocker_user_id_idx" ON "user_blocks"("blocked_user_id", "blocker_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blocker_user_id_blocked_user_id_key" ON "user_blocks"("blocker_user_id", "blocked_user_id");

-- CreateIndex
CREATE INDEX "user_reports_status_created_at_idx" ON "user_reports"("status", "created_at");

-- CreateIndex
CREATE INDEX "user_reports_reported_user_id_idx" ON "user_reports"("reported_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_cases_report_id_key" ON "moderation_cases"("report_id");

-- CreateIndex
CREATE INDEX "moderation_cases_status_severity_created_at_idx" ON "moderation_cases"("status", "severity", "created_at");

-- CreateIndex
CREATE INDEX "moderation_cases_target_user_id_idx" ON "moderation_cases"("target_user_id");

-- CreateIndex
CREATE INDEX "moderation_actions_target_user_id_action_type_created_at_idx" ON "moderation_actions"("target_user_id", "action_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_verifications_user_id_verification_type_status_idx" ON "user_verifications"("user_id", "verification_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_verifications_provider_provider_inquiry_id_key" ON "user_verifications"("provider", "provider_inquiry_id");

-- CreateIndex
CREATE INDEX "safety_checkins_scheduled_time_status_idx" ON "safety_checkins"("scheduled_time", "status");

-- CreateIndex
CREATE INDEX "trusted_contacts_user_id_idx" ON "trusted_contacts"("user_id");

-- CreateIndex
CREATE INDEX "date_plans_match_id_start_time_idx" ON "date_plans"("match_id", "start_time" DESC);

-- CreateIndex
CREATE INDEX "date_plans_start_time_status_idx" ON "date_plans"("start_time", "status");

-- CreateIndex
CREATE INDEX "emergency_events_status_triggered_at_idx" ON "emergency_events"("status", "triggered_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_code_key" ON "admin_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_key_key" ON "admin_permissions"("key");

-- CreateIndex
CREATE INDEX "admin_access_requests_status_created_at_idx" ON "admin_access_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_timestamp_idx" ON "audit_logs"("resource_type", "resource_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_admin_user_id_timestamp_idx" ON "audit_logs"("admin_user_id", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "user_subscriptions_user_id_status_current_period_end_idx" ON "user_subscriptions"("user_id", "status", "current_period_end" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_payment_gateway_external_subscription_id_key" ON "user_subscriptions"("payment_gateway", "external_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_external_transaction_id_key" ON "payment_transactions"("external_transaction_id");

-- CreateIndex
CREATE INDEX "payment_transactions_user_id_created_at_idx" ON "payment_transactions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "analytics_events_event_name_server_timestamp_idx" ON "analytics_events"("event_name", "server_timestamp" DESC);

-- AddForeignKey
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_auth" ADD CONSTRAINT "two_factor_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_prompts" ADD CONSTRAINT "profile_prompts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_prompts" ADD CONSTRAINT "profile_prompts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "prompt_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "interest_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interests" ADD CONSTRAINT "profile_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_relationship_intents" ADD CONSTRAINT "profile_relationship_intents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_relationship_intents" ADD CONSTRAINT "profile_relationship_intents_intent_id_fkey" FOREIGN KEY ("intent_id") REFERENCES "relationship_intents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_preferences" ADD CONSTRAINT "discovery_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_answers" ADD CONSTRAINT "compatibility_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_answers" ADD CONSTRAINT "compatibility_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "compatibility_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interactions" ADD CONSTRAINT "profile_interactions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_interactions" ADD CONSTRAINT "profile_interactions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_closed_by_user_id_fkey" FOREIGN KEY ("closed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_reasons" ADD CONSTRAINT "match_reasons_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_media" ADD CONSTRAINT "message_media_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_privacy_settings" ADD CONSTRAINT "location_privacy_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_events" ADD CONSTRAINT "location_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crossed_paths" ADD CONSTRAINT "crossed_paths_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crossed_paths" ADD CONSTRAINT "crossed_paths_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_location_shares" ADD CONSTRAINT "live_location_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_location_shares" ADD CONSTRAINT "live_location_shares_date_plan_id_fkey" FOREIGN KEY ("date_plan_id") REFERENCES "date_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_user_id_fkey" FOREIGN KEY ("blocker_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "user_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_assigned_moderator_id_fkey" FOREIGN KEY ("assigned_moderator_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "moderation_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_performed_by_admin_id_fkey" FOREIGN KEY ("performed_by_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_checkins" ADD CONSTRAINT "safety_checkins_date_plan_id_fkey" FOREIGN KEY ("date_plan_id") REFERENCES "date_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_checkins" ADD CONSTRAINT "safety_checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plans" ADD CONSTRAINT "date_plans_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plans" ADD CONSTRAINT "date_plans_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_events" ADD CONSTRAINT "emergency_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_events" ADD CONSTRAINT "emergency_events_date_plan_id_fkey" FOREIGN KEY ("date_plan_id") REFERENCES "date_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_events" ADD CONSTRAINT "emergency_events_resolved_by_admin_id_fkey" FOREIGN KEY ("resolved_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_roles" ADD CONSTRAINT "admin_user_roles_assigned_by_admin_id_fkey" FOREIGN KEY ("assigned_by_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_access_requests" ADD CONSTRAINT "admin_access_requests_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_access_requests" ADD CONSTRAINT "admin_access_requests_approved_by_admin_id_fkey" FOREIGN KEY ("approved_by_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- PostGIS Spatial GIST Indexes
CREATE INDEX IF NOT EXISTS "idx_location_events_gist" ON "location_events" USING GIST ("coarse_location");
CREATE INDEX IF NOT EXISTS "idx_live_location_shares_gist" ON "live_location_shares" USING GIST ("latest_point");
CREATE INDEX IF NOT EXISTS "idx_date_plans_venue_gist" ON "date_plans" USING GIST ("venue_location");
CREATE INDEX IF NOT EXISTS "idx_emergency_events_dispatch_gist" ON "emergency_events" USING GIST ("dispatch_location");

-- Domain Integrity Constraints
ALTER TABLE "profiles" ADD CONSTRAINT "chk_profile_age" CHECK (birth_date <= CURRENT_DATE - INTERVAL '18 years');
ALTER TABLE "discovery_preferences" ADD CONSTRAINT "chk_discovery_age" CHECK (min_age >= 18 AND max_age >= min_age);
ALTER TABLE "matches" ADD CONSTRAINT "chk_user_order" CHECK (user1_id < user2_id);
ALTER TABLE "crossed_paths" ADD CONSTRAINT "chk_crossed_user_order" CHECK (user1_id < user2_id);
ALTER TABLE "profile_interactions" ADD CONSTRAINT "chk_no_self_interaction" CHECK (actor_user_id <> target_user_id);
ALTER TABLE "user_blocks" ADD CONSTRAINT "chk_no_self_block" CHECK (blocker_user_id <> blocked_user_id);
ALTER TABLE "admin_access_requests" ADD CONSTRAINT "chk_no_self_approval" CHECK (admin_user_id <> approved_by_admin_id);

