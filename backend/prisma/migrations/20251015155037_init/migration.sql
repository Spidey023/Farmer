/*
  Warnings:

  - You are about to drop the `crop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `farmer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `field` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `field_season_plan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `field_snapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lease` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recommendation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `season` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."field" DROP CONSTRAINT "field_farmer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."field_season_plan" DROP CONSTRAINT "field_season_plan_crop_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."field_season_plan" DROP CONSTRAINT "field_season_plan_field_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."field_season_plan" DROP CONSTRAINT "field_season_plan_season_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."field_snapshot" DROP CONSTRAINT "field_snapshot_field_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."lease" DROP CONSTRAINT "lease_field_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order" DROP CONSTRAINT "order_farmer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item" DROP CONSTRAINT "order_item_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item" DROP CONSTRAINT "order_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recommendation" DROP CONSTRAINT "recommendation_field_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recommendation" DROP CONSTRAINT "recommendation_recommended_crop_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."recommendation" DROP CONSTRAINT "recommendation_season_id_fkey";

-- DropTable
DROP TABLE "public"."crop";

-- DropTable
DROP TABLE "public"."farmer";

-- DropTable
DROP TABLE "public"."field";

-- DropTable
DROP TABLE "public"."field_season_plan";

-- DropTable
DROP TABLE "public"."field_snapshot";

-- DropTable
DROP TABLE "public"."lease";

-- DropTable
DROP TABLE "public"."order";

-- DropTable
DROP TABLE "public"."order_item";

-- DropTable
DROP TABLE "public"."product";

-- DropTable
DROP TABLE "public"."recommendation";

-- DropTable
DROP TABLE "public"."season";

-- CreateTable
CREATE TABLE "Farmer" (
    "farmerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT,
    "fullName" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("farmerId")
);

-- CreateTable
CREATE TABLE "Field" (
    "fieldId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "landImage" TEXT,
    "landType" TEXT,
    "currentCrop" TEXT,
    "soilType" TEXT,
    "surveyNumber" INTEGER,
    "acres" DECIMAL(10,2),
    "irrigationType" TEXT,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("fieldId")
);

-- CreateTable
CREATE TABLE "Crop" (
    "cropId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("cropId")
);

-- CreateTable
CREATE TABLE "Season" (
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("seasonId")
);

-- CreateTable
CREATE TABLE "FieldSeasonPlan" (
    "planId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "expectedYield" DECIMAL(12,2),
    "expectedCost" DECIMAL(12,2),
    "status" "FieldPlanStatus" NOT NULL,

    CONSTRAINT "FieldSeasonPlan_pkey" PRIMARY KEY ("planId")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "recommendationId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "recommendedCropId" TEXT NOT NULL,
    "rationaleJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("recommendationId")
);

-- CreateTable
CREATE TABLE "Product" (
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "Order" (
    "orderId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "orderItemId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderItemId")
);

-- CreateTable
CREATE TABLE "FieldSnapshot" (
    "snapshotId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "avgMoisture" DOUBLE PRECISION,
    "lastPh" DOUBLE PRECISION,
    "soilTemp" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "FieldSnapshot_pkey" PRIMARY KEY ("snapshotId")
);

-- CreateTable
CREATE TABLE "Lease" (
    "leaseId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "modelType" "LeaseModelType" NOT NULL,
    "profitSharePct" DECIMAL(5,2),
    "rentAmount" DECIMAL(12,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("leaseId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_email_key" ON "Farmer"("email");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("farmerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldSeasonPlan" ADD CONSTRAINT "FieldSeasonPlan_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("fieldId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldSeasonPlan" ADD CONSTRAINT "FieldSeasonPlan_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("seasonId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldSeasonPlan" ADD CONSTRAINT "FieldSeasonPlan_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("cropId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("fieldId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("seasonId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_recommendedCropId_fkey" FOREIGN KEY ("recommendedCropId") REFERENCES "Crop"("cropId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("farmerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldSnapshot" ADD CONSTRAINT "FieldSnapshot_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("fieldId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("fieldId") ON DELETE RESTRICT ON UPDATE CASCADE;
