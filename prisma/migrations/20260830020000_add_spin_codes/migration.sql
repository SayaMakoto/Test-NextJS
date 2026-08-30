CREATE TABLE "SpinCode" ("id" TEXT NOT NULL, "code" TEXT NOT NULL, "amount" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'unused', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SpinCode_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SpinCodeRedemption" ("id" TEXT NOT NULL, "codeId" TEXT NOT NULL, "userId" TEXT NOT NULL, "remaining" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SpinCodeRedemption_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "SpinCode_code_key" ON "SpinCode"("code");
CREATE UNIQUE INDEX "SpinCodeRedemption_codeId_userId_key" ON "SpinCodeRedemption"("codeId", "userId");
CREATE INDEX "SpinCodeRedemption_userId_remaining_idx" ON "SpinCodeRedemption"("userId", "remaining");
ALTER TABLE "SpinCodeRedemption" ADD CONSTRAINT "SpinCodeRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "SpinCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpinCodeRedemption" ADD CONSTRAINT "SpinCodeRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
