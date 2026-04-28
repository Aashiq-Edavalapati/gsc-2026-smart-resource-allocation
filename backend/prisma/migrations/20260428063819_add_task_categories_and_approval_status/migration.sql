/*
  Warnings:

  - Added the required column `category` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('SUGGESTED', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "VerifyStatus" ADD VALUE 'CONTACT_ADDED';

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'SUGGESTED',
ADD COLUMN     "approvedByMembershipId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'SUGGESTED',
ADD COLUMN     "approvedByMembershipId" TEXT,
ADD COLUMN     "category" "IssueCategory" NOT NULL;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_approvedByMembershipId_fkey" FOREIGN KEY ("approvedByMembershipId") REFERENCES "OrganizationMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_approvedByMembershipId_fkey" FOREIGN KEY ("approvedByMembershipId") REFERENCES "OrganizationMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
