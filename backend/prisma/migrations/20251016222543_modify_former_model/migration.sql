/*
  Warnings:

  - Made the column `username` on table `Farmer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Farmer" ALTER COLUMN "username" SET NOT NULL;
