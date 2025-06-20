-- CreateTable
CREATE TABLE "ModifiedFields" (
    "id" SERIAL NOT NULL,
    "recordId" TEXT NOT NULL,

    CONSTRAINT "ModifiedFields_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ModifiedFields" ADD CONSTRAINT "ModifiedFields_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "MaterialRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
