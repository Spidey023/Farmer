-- CreateEnum
CREATE TYPE "FieldPlanStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaseModelType" AS ENUM ('STANDARD', 'HYBRID');

-- CreateTable
CREATE TABLE "farmer" (
    "farmer_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "phone_number" TEXT,
    "address" TEXT,

    CONSTRAINT "farmer_pkey" PRIMARY KEY ("farmer_id")
);

-- CreateTable
CREATE TABLE "field" (
    "field_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "land_image" TEXT,
    "land_type" TEXT,
    "current_crop" TEXT,
    "soil_type" TEXT,
    "survey_number" INTEGER,
    "acres" DECIMAL(10,2),
    "irrigation_type" TEXT,

    CONSTRAINT "field_pkey" PRIMARY KEY ("field_id")
);

-- CreateTable
CREATE TABLE "crop" (
    "crop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "crop_pkey" PRIMARY KEY ("crop_id")
);

-- CreateTable
CREATE TABLE "season" (
    "season_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_pkey" PRIMARY KEY ("season_id")
);

-- CreateTable
CREATE TABLE "field_season_plan" (
    "plan_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "crop_id" TEXT NOT NULL,
    "expected_yield" DECIMAL(12,2),
    "expected_cost" DECIMAL(12,2),
    "status" "FieldPlanStatus" NOT NULL,

    CONSTRAINT "field_season_plan_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "recommendation" (
    "recommendation_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "recommended_crop_id" TEXT NOT NULL,
    "rationale_json" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_pkey" PRIMARY KEY ("recommendation_id")
);

-- CreateTable
CREATE TABLE "product" (
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "unit" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "order" (
    "order_id" TEXT NOT NULL,
    "farmer_id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "placed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "order_item_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "field_snapshot" (
    "snapshot_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "avg_moisture" DOUBLE PRECISION,
    "last_ph" DOUBLE PRECISION,
    "soil_temp" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "field_snapshot_pkey" PRIMARY KEY ("snapshot_id")
);

-- CreateTable
CREATE TABLE "lease" (
    "lease_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "model_type" "LeaseModelType" NOT NULL,
    "profit_share_pct" DECIMAL(5,2),
    "rent_amount" DECIMAL(12,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "lease_pkey" PRIMARY KEY ("lease_id")
);

-- AddForeignKey
ALTER TABLE "field" ADD CONSTRAINT "field_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmer"("farmer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_season_plan" ADD CONSTRAINT "field_season_plan_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "field"("field_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_season_plan" ADD CONSTRAINT "field_season_plan_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_season_plan" ADD CONSTRAINT "field_season_plan_crop_id_fkey" FOREIGN KEY ("crop_id") REFERENCES "crop"("crop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "field"("field_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("season_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_recommended_crop_id_fkey" FOREIGN KEY ("recommended_crop_id") REFERENCES "crop"("crop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmer"("farmer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_snapshot" ADD CONSTRAINT "field_snapshot_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "field"("field_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease" ADD CONSTRAINT "lease_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "field"("field_id") ON DELETE RESTRICT ON UPDATE CASCADE;
