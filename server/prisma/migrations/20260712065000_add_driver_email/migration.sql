-- AlterTable: add email as nullable first, backfill existing rows, then enforce NOT NULL + UNIQUE
ALTER TABLE "Driver" ADD COLUMN "email" TEXT;

UPDATE "Driver" SET "email" = LOWER("id") || '@placeholder.transitops.com' WHERE "email" IS NULL;

ALTER TABLE "Driver" ALTER COLUMN "email" SET NOT NULL;

CREATE UNIQUE INDEX "Driver_email_key" ON "Driver"("email");
