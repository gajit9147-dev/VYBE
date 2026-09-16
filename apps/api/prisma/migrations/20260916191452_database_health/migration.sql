-- CreateTable
CREATE TABLE "DatabaseHealth" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatabaseHealth_pkey" PRIMARY KEY ("id")
);
