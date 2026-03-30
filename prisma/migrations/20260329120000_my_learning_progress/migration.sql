-- AlterTable
ALTER TABLE "lms_lessons" ADD COLUMN IF NOT EXISTS "resources" JSONB;

-- AlterTable
ALTER TABLE "lms_enrollments" ADD COLUMN IF NOT EXISTS "last_accessed_lesson_id" UUID;
ALTER TABLE "lms_enrollments" ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ(6);
ALTER TABLE "lms_enrollments" ADD COLUMN IF NOT EXISTS "certificate_issued_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lms_lesson_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "last_accessed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_lesson_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_lms_lesson_progress_student_lesson" ON "lms_lesson_progress"("student_id", "lesson_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lms_lesson_progress_lesson_id_fkey'
  ) THEN
    ALTER TABLE "lms_lesson_progress" ADD CONSTRAINT "lms_lesson_progress_lesson_id_fkey"
      FOREIGN KEY ("lesson_id") REFERENCES "lms_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
