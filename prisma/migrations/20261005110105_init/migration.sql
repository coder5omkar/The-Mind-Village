-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "shadow" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" TEXT NOT NULL,
    "residentAId" TEXT NOT NULL,
    "residentBId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thought" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "primaryResidentId" TEXT,
    "confidence" DOUBLE PRECISION,
    "secondaryResidents" JSONB,
    "neighbors" JSONB,
    "suggestedAction" TEXT,
    "reasoning" TEXT,
    "source" TEXT,
    "userCorrectedResidentId" TEXT,
    "feedback" TEXT,
    "actionTaken" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Thought_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResidentPower" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "power" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "ResidentPower_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuthEvent_userId_createdAt_idx" ON "AuthEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_name_key" ON "Resident"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_residentAId_residentBId_key" ON "Neighborhood"("residentAId", "residentBId");

-- CreateIndex
CREATE INDEX "Thought_userId_createdAt_idx" ON "Thought"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ResidentPower_userId_date_idx" ON "ResidentPower"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ResidentPower_userId_residentId_date_key" ON "ResidentPower"("userId", "residentId", "date");

-- AddForeignKey
ALTER TABLE "AuthEvent" ADD CONSTRAINT "AuthEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_residentAId_fkey" FOREIGN KEY ("residentAId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_residentBId_fkey" FOREIGN KEY ("residentBId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_primaryResidentId_fkey" FOREIGN KEY ("primaryResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_userCorrectedResidentId_fkey" FOREIGN KEY ("userCorrectedResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentPower" ADD CONSTRAINT "ResidentPower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResidentPower" ADD CONSTRAINT "ResidentPower_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
