-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "documentUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
