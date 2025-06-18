-- DropForeignKey
ALTER TABLE "MaterialRecord" DROP CONSTRAINT "MaterialRecord_fileId_fkey";

-- AddForeignKey
ALTER TABLE "MaterialRecord" ADD CONSTRAINT "MaterialRecord_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
