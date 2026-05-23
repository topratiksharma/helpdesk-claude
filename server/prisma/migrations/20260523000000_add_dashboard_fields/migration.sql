-- AlterTable: add AI resolution tracking and resolution timestamp
ALTER TABLE "Ticket" ADD COLUMN "autoResolved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ticket" ADD COLUMN "resolvedAt" TIMESTAMP(3);
