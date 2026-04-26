-- DropIndex
DROP INDEX "issue_location_gist";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "darpanId" TEXT,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "verificationOtp" TEXT,
ADD COLUMN     "verifiedEmail" TEXT;
