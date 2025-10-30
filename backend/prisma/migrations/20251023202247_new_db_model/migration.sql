/*
  Warnings:

  - The `category` column on the `Crop` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Lease` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `category` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `currentCrop` on table `Field` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `soilType` to the `Field` table without a default value. This is not possible if the table is not empty.
  - Made the column `surveyNumber` on table `Field` required. This step will fail if there are existing NULL values in that column.
  - Made the column `acres` on table `Field` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `irrigationType` to the `Field` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `Season` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "IrrigationType" AS ENUM ('NONE', 'MANUAL', 'DRIP', 'SPRINKLER', 'FLOOD', 'CANAL', 'RAINFED', 'OTHER');

-- CreateEnum
CREATE TYPE "SoilType" AS ENUM ('CLAY', 'SANDY', 'SILTY', 'PEATY', 'CHALKY', 'LOAMY', 'RED', 'BLACK', 'LATERITE', 'SALINE', 'OTHER');

-- CreateEnum
CREATE TYPE "CropCategory" AS ENUM ('CEREAL', 'PULSE', 'OILSEED', 'FRUIT', 'VEGETABLE', 'SPICE', 'FIBER', 'PLANTATION', 'FLORICULTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('KHARIF', 'RABI', 'ZAID', 'SUMMER', 'WINTER', 'AUTUMN', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('SEEDS', 'FERTILIZER', 'PESTICIDE', 'EQUIPMENT', 'IRRIGATION', 'TOOL', 'HARVEST', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'TERMINATED', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "FieldQuality" AS ENUM ('GOOD', 'MODERATE', 'POOR');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'UPI', 'WALLET', 'NETBANKING');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CropStatus" AS ENUM ('SOWN', 'GERMINATED', 'VEGETATIVE', 'FLOWERING', 'HARVEST_READY', 'HARVESTED', 'DAMAGED');

-- CreateEnum
CREATE TYPE "RecommendationSource" AS ENUM ('AI', 'EXPERT', 'HYBRID');

-- AlterTable
ALTER TABLE "Crop" DROP COLUMN "category",
ADD COLUMN     "category" "CropCategory" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "Field" ALTER COLUMN "currentCrop" SET NOT NULL,
DROP COLUMN "soilType",
ADD COLUMN     "soilType" "SoilType" NOT NULL,
ALTER COLUMN "surveyNumber" SET NOT NULL,
ALTER COLUMN "acres" SET NOT NULL,
DROP COLUMN "irrigationType",
ADD COLUMN     "irrigationType" "IrrigationType" NOT NULL;

-- AlterTable
ALTER TABLE "FieldSeasonPlan" ADD COLUMN     "cropStatus" "CropStatus" NOT NULL DEFAULT 'SOWN';

-- AlterTable
ALTER TABLE "FieldSnapshot" ADD COLUMN     "quality" "FieldQuality";

-- AlterTable
ALTER TABLE "Lease" DROP COLUMN "status",
ADD COLUMN     "status" "LeaseStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'INITIATED';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
ADD COLUMN     "category" "ProductCategory" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "source" "RecommendationSource" NOT NULL DEFAULT 'AI';

-- AlterTable
ALTER TABLE "Season" DROP COLUMN "name",
ADD COLUMN     "name" "SeasonType" NOT NULL;

-- CreateIndex
CREATE INDEX "FieldSeasonPlan_fieldId_idx" ON "FieldSeasonPlan"("fieldId");

-- CreateIndex
CREATE INDEX "FieldSeasonPlan_seasonId_idx" ON "FieldSeasonPlan"("seasonId");

-- CreateIndex
CREATE INDEX "FieldSeasonPlan_cropId_idx" ON "FieldSeasonPlan"("cropId");

-- CreateIndex
CREATE INDEX "FieldSnapshot_fieldId_at_idx" ON "FieldSnapshot"("fieldId", "at");

-- CreateIndex
CREATE INDEX "Lease_fieldId_idx" ON "Lease"("fieldId");

-- CreateIndex
CREATE INDEX "Order_farmerId_idx" ON "Order"("farmerId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "Recommendation_fieldId_idx" ON "Recommendation"("fieldId");

-- CreateIndex
CREATE INDEX "Recommendation_seasonId_idx" ON "Recommendation"("seasonId");

-- CreateIndex
CREATE INDEX "Recommendation_recommendedCropId_idx" ON "Recommendation"("recommendedCropId");
