-- CreateTable
CREATE TABLE "snippet_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snippet_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snippet_examples" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snippet_examples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "snippet_categories_name_key" ON "snippet_categories"("name");

-- CreateIndex
CREATE INDEX "snippet_categories_order_idx" ON "snippet_categories"("order");

-- CreateIndex
CREATE INDEX "snippet_categories_enabled_idx" ON "snippet_categories"("enabled");

-- CreateIndex
CREATE INDEX "snippet_examples_categoryId_idx" ON "snippet_examples"("categoryId");

-- CreateIndex
CREATE INDEX "snippet_examples_order_idx" ON "snippet_examples"("order");

-- CreateIndex
CREATE INDEX "snippet_examples_enabled_idx" ON "snippet_examples"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "snippet_examples_categoryId_title_key" ON "snippet_examples"("categoryId", "title");

-- AddForeignKey
ALTER TABLE "snippet_examples" ADD CONSTRAINT "snippet_examples_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "snippet_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
