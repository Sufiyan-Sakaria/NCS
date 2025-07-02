/*
  Warnings:

  - Added the required column `Code` to the `AccountGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AccountGroup" ADD COLUMN     "Code" TEXT NOT NULL;
