-- DropIndex
DROP INDEX "Task_projectId_idx";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "label" TEXT NOT NULL DEFAULT 'Development';
