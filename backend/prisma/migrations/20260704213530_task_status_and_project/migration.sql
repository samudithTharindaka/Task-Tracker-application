-- 1. Remap TaskStatus enum: PENDING -> TODO, keep IN_PROGRESS/DONE, add TEST.
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'TEST', 'DONE');

ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus" USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'TODO'
    WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'
    WHEN 'DONE' THEN 'DONE'
  END
)::"TaskStatus";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'TODO';

DROP TYPE "TaskStatus_old";

-- 2. Project table.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "Project" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Backfill: one default "My Board" project per existing user, then point
-- every existing task at its owner's default project.
INSERT INTO "Project" ("id", "name", "ownerId")
SELECT gen_random_uuid()::text, 'My Board', "id" FROM "User";

ALTER TABLE "Task" ADD COLUMN "projectId" TEXT;

UPDATE "Task" t
SET "projectId" = p."id"
FROM "Project" p
WHERE p."ownerId" = t."ownerId";

ALTER TABLE "Task" ALTER COLUMN "projectId" SET NOT NULL;
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
