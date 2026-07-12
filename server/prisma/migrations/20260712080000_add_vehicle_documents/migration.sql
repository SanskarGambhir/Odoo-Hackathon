-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "rcNumber" TEXT,
ADD COLUMN "insuranceNumber" TEXT,
ADD COLUMN "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN "pucNumber" TEXT,
ADD COLUMN "pucExpiry" TIMESTAMP(3),
ADD COLUMN "insuranceExpired" BOOLEAN NOT NULL DEFAULT false;
