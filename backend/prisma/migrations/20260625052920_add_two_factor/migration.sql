-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "bulkDiscountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bulkDiscountPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "rating" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramLinkCode" TEXT,
ADD COLUMN     "telegramLinkExpiresAt" TIMESTAMP(3),
ADD COLUMN     "telegramLinkedAt" TIMESTAMP(3),
ADD COLUMN     "telegramUsername" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LOGIN_2FA',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpCode_userId_type_idx" ON "OtpCode"("userId", "type");

-- CreateIndex
CREATE INDEX "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");
