-- Enable UUID extension if needed (built-in for modern Postgres, but good to ensure)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Polls Table
CREATE TABLE IF NOT EXISTS "Poll" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "Poll_createdAt_idx" ON "Poll"("createdAt");

-- Options Table
CREATE TABLE IF NOT EXISTS "Option" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "text" TEXT NOT NULL,
    "pollId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "Option_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Option_pollId_idx" ON "Option"("pollId");
CREATE UNIQUE INDEX IF NOT EXISTS "Option_pollId_position_key" ON "Option"("pollId", "position");

-- Votes Table
CREATE TABLE IF NOT EXISTS "Vote" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "pollId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "ipAddress" TEXT,
    "fingerprint" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE,
    CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Vote_pollId_idx" ON "Vote"("pollId");
CREATE INDEX IF NOT EXISTS "Vote_optionId_idx" ON "Vote"("optionId");
CREATE INDEX IF NOT EXISTS "Vote_ipAddress_pollId_idx" ON "Vote"("ipAddress", "pollId");
CREATE INDEX IF NOT EXISTS "Vote_fingerprint_pollId_idx" ON "Vote"("fingerprint", "pollId");

-- Trigger for updatedAt on Poll
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_poll_updated_at
    BEFORE UPDATE ON "Poll"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
