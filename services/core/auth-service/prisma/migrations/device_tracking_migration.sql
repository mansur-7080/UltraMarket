-- AlterTable: Update the RefreshToken table
ALTER TABLE "refresh_tokens" 
ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "deviceId" TEXT,
ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
ADD COLUMN IF NOT EXISTS "ip" TEXT;

-- CreateTable: Create the UserDevice table
CREATE TABLE IF NOT EXISTS "user_devices" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "browser" TEXT,
  "browserVersion" TEXT,
  "os" TEXT,
  "osVersion" TEXT,
  "device" TEXT,
  "ip" TEXT,
  "lastAccessed" TIMESTAMP(3) NOT NULL,
  "isTrusted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Create unique constraint on userId and deviceId
CREATE UNIQUE INDEX IF NOT EXISTS "user_devices_userId_deviceId_key" ON "user_devices"("userId", "deviceId");

-- AddForeignKey: Add foreign key constraint
ALTER TABLE "user_devices"
ADD CONSTRAINT "user_devices_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
