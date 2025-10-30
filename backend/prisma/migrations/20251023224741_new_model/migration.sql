/*
  Warnings:

  - You are about to drop the column `currentCrop` on the `Field` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fieldId,seasonId]` on the table `FieldSeasonPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Crop" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "defaultCostPerAcre" DECIMAL(12,2),
ADD COLUMN     "defaultYieldPerAcre" DECIMAL(12,2),
ADD COLUMN     "durationDays" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Farmer" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Field" DROP COLUMN "currentCrop",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentCropId" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "FieldSeasonPlan" ADD COLUMN     "actualEndDate" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expectedEndDate" TIMESTAMP(3),
ADD COLUMN     "sowingDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "FieldSnapshot" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fieldId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "CropSeasonTemplate" (
    "templateId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "region" TEXT,
    "soilType" "SoilType",
    "irrigationType" "IrrigationType",
    "defaultYieldPerAcre" DECIMAL(12,2),
    "defaultCostPerAcre" DECIMAL(12,2),
    "durationDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropSeasonTemplate_pkey" PRIMARY KEY ("templateId")
);

-- CreateIndex
CREATE INDEX "CropSeasonTemplate_cropId_seasonId_idx" ON "CropSeasonTemplate"("cropId", "seasonId");

-- CreateIndex
CREATE INDEX "CropSeasonTemplate_region_idx" ON "CropSeasonTemplate"("region");

-- CreateIndex
CREATE INDEX "CropSeasonTemplate_soilType_idx" ON "CropSeasonTemplate"("soilType");

-- CreateIndex
CREATE INDEX "CropSeasonTemplate_irrigationType_idx" ON "CropSeasonTemplate"("irrigationType");

-- CreateIndex
CREATE INDEX "Field_farmerId_idx" ON "Field"("farmerId");

-- CreateIndex
CREATE INDEX "Field_region_idx" ON "Field"("region");

-- CreateIndex
CREATE INDEX "Field_currentCropId_idx" ON "Field"("currentCropId");

-- CreateIndex
CREATE INDEX "FieldSeasonPlan_status_idx" ON "FieldSeasonPlan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FieldSeasonPlan_fieldId_seasonId_key" ON "FieldSeasonPlan"("fieldId", "seasonId");

-- CreateIndex
CREATE INDEX "Lease_status_idx" ON "Lease"("status");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_placedAt_idx" ON "Order"("placedAt");

-- CreateIndex
CREATE INDEX "OrderItem_fieldId_idx" ON "OrderItem"("fieldId");

-- CreateIndex
CREATE INDEX "Recommendation_generatedAt_idx" ON "Recommendation"("generatedAt");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_currentCropId_fkey" FOREIGN KEY ("currentCropId") REFERENCES "Crop"("cropId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("fieldId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropSeasonTemplate" ADD CONSTRAINT "CropSeasonTemplate_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("cropId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropSeasonTemplate" ADD CONSTRAINT "CropSeasonTemplate_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("seasonId") ON DELETE RESTRICT ON UPDATE CASCADE;
