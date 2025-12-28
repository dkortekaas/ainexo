-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('STANDARD', 'LANDING', 'MARKETING', 'LEGAL', 'CUSTOM');

-- CreateTable
CREATE TABLE "cms_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "ogImage" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'nl',
    "pageType" "PageType" NOT NULL DEFAULT 'STANDARD',
    "layout" TEXT,
    "customFields" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_page_versions" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "excerpt" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "cms_page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "excerpt" TEXT,
    "featuredImage" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "ogImage" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'nl',
    "readingTime" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "customFields" JSONB,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blog_versions" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "excerpt" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "cms_blog_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "caption" TEXT,
    "folder" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'nl',
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'nl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_page_categories" (
    "pageId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "cms_page_categories_pkey" PRIMARY KEY ("pageId","categoryId")
);

-- CreateTable
CREATE TABLE "cms_page_tags" (
    "pageId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "cms_page_tags_pkey" PRIMARY KEY ("pageId","tagId")
);

-- CreateTable
CREATE TABLE "cms_blog_categories" (
    "blogPostId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "cms_blog_categories_pkey" PRIMARY KEY ("blogPostId","categoryId")
);

-- CreateTable
CREATE TABLE "cms_blog_tags" (
    "blogPostId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "cms_blog_tags_pkey" PRIMARY KEY ("blogPostId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_pages_slug_key" ON "cms_pages"("slug");

-- CreateIndex
CREATE INDEX "cms_pages_status_idx" ON "cms_pages"("status");

-- CreateIndex
CREATE INDEX "cms_pages_authorId_idx" ON "cms_pages"("authorId");

-- CreateIndex
CREATE INDEX "cms_pages_publishedAt_idx" ON "cms_pages"("publishedAt");

-- CreateIndex
CREATE INDEX "cms_pages_locale_idx" ON "cms_pages"("locale");

-- CreateIndex
CREATE INDEX "cms_pages_pageType_idx" ON "cms_pages"("pageType");

-- CreateIndex
CREATE INDEX "cms_page_versions_pageId_idx" ON "cms_page_versions"("pageId");

-- CreateIndex
CREATE INDEX "cms_page_versions_createdById_idx" ON "cms_page_versions"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "cms_page_versions_pageId_versionNumber_key" ON "cms_page_versions"("pageId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "cms_blog_posts_slug_key" ON "cms_blog_posts"("slug");

-- CreateIndex
CREATE INDEX "cms_blog_posts_status_idx" ON "cms_blog_posts"("status");

-- CreateIndex
CREATE INDEX "cms_blog_posts_authorId_idx" ON "cms_blog_posts"("authorId");

-- CreateIndex
CREATE INDEX "cms_blog_posts_publishedAt_idx" ON "cms_blog_posts"("publishedAt");

-- CreateIndex
CREATE INDEX "cms_blog_posts_locale_idx" ON "cms_blog_posts"("locale");

-- CreateIndex
CREATE INDEX "cms_blog_versions_blogPostId_idx" ON "cms_blog_versions"("blogPostId");

-- CreateIndex
CREATE INDEX "cms_blog_versions_createdById_idx" ON "cms_blog_versions"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "cms_blog_versions_blogPostId_versionNumber_key" ON "cms_blog_versions"("blogPostId", "versionNumber");

-- CreateIndex
CREATE INDEX "cms_media_uploadedById_idx" ON "cms_media"("uploadedById");

-- CreateIndex
CREATE INDEX "cms_media_mimeType_idx" ON "cms_media"("mimeType");

-- CreateIndex
CREATE INDEX "cms_media_folder_idx" ON "cms_media"("folder");

-- CreateIndex
CREATE UNIQUE INDEX "cms_categories_slug_key" ON "cms_categories"("slug");

-- CreateIndex
CREATE INDEX "cms_categories_parentId_idx" ON "cms_categories"("parentId");

-- CreateIndex
CREATE INDEX "cms_categories_locale_idx" ON "cms_categories"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "cms_tags_slug_key" ON "cms_tags"("slug");

-- CreateIndex
CREATE INDEX "cms_tags_locale_idx" ON "cms_tags"("locale");

-- CreateIndex
CREATE INDEX "cms_page_categories_categoryId_idx" ON "cms_page_categories"("categoryId");

-- CreateIndex
CREATE INDEX "cms_page_tags_tagId_idx" ON "cms_page_tags"("tagId");

-- CreateIndex
CREATE INDEX "cms_blog_categories_categoryId_idx" ON "cms_blog_categories"("categoryId");

-- CreateIndex
CREATE INDEX "cms_blog_tags_tagId_idx" ON "cms_blog_tags"("tagId");

-- AddForeignKey
ALTER TABLE "cms_pages" ADD CONSTRAINT "cms_pages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_page_versions" ADD CONSTRAINT "cms_page_versions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "cms_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_page_versions" ADD CONSTRAINT "cms_page_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blog_posts" ADD CONSTRAINT "cms_blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blog_versions" ADD CONSTRAINT "cms_blog_versions_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "cms_blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blog_versions" ADD CONSTRAINT "cms_blog_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_media" ADD CONSTRAINT "cms_media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_categories" ADD CONSTRAINT "cms_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "cms_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_page_categories" ADD CONSTRAINT "cms_page_categories_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "cms_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_page_categories" ADD CONSTRAINT "cms_page_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "cms_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_page_tags" ADD CONSTRAINT "cms_page_tags_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "cms_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_page_tags" ADD CONSTRAINT "cms_page_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "cms_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blog_categories" ADD CONSTRAINT "cms_blog_categories_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "cms_blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blog_categories" ADD CONSTRAINT "cms_blog_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "cms_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blog_tags" ADD CONSTRAINT "cms_blog_tags_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "cms_blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blog_tags" ADD CONSTRAINT "cms_blog_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "cms_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
