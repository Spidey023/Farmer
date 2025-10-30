/*
  Warnings:

  - Added the required column `landType` to the `Field` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LandType" AS ENUM ('AGRICULTURAL', 'HORTICULTURAL', 'PASTURE', 'WASTELAND', 'PLANTATION', 'ORCHARD', 'AQUACULTURE', 'OTHER');

-- AlterTable
ALTER TABLE "Field" DROP COLUMN "landType",
ADD COLUMN     "landType" "LandType" NOT NULL;
