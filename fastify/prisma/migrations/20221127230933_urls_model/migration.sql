-- CreateTable
CREATE TABLE "Url" (
    "id" SERIAL NOT NULL,
    "original" VARCHAR(255) NOT NULL,
    "shortened" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Url_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Url_shortened_key" ON "Url"("shortened");
