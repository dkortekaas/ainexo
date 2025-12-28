import { getBlogPosts, calculateReadingTime } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import type { BlogPost } from "@/sanity/lib/types";

export interface ListBlogPostsOptions {
  status?: "PUBLISHED" | "DRAFT" | "ALL";
  locale?: string;
  limit?: number;
  offset?: number;
}

export interface BlogPostListItem {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  publishedAt?: string;
  createdAt: string;
  featuredImage?: string;
  readingTime?: number;
  viewCount?: number;
}

export interface ListBlogPostsResult {
  items: BlogPostListItem[];
  total: number;
}

/**
 * List blog posts from Sanity CMS
 */
export async function listBlogPosts(
  options: ListBlogPostsOptions = {}
): Promise<ListBlogPostsResult> {
  const {
    status = "PUBLISHED",
    locale = "nl",
    limit = 100,
    offset = 0,
  } = options;

  try {
    // Fetch blog posts from Sanity
    // Use preview mode if status is DRAFT or ALL
    const preview = status === "DRAFT" || status === "ALL";
    const posts = await getBlogPosts(locale, preview);

    // Filter by status if needed
    let filteredPosts = posts;
    if (status === "PUBLISHED") {
      const now = new Date().toISOString();
      filteredPosts = posts.filter(
        (post) => !post.publishedAt || post.publishedAt <= now
      );
    } else if (status === "DRAFT") {
      const now = new Date().toISOString();
      filteredPosts = posts.filter(
        (post) => !post.publishedAt || post.publishedAt > now
      );
    }

    // Apply limit and offset
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    // Transform to the expected format
    const items: BlogPostListItem[] = paginatedPosts.map((post) => ({
      id: post._id,
      title: post.title,
      excerpt: post.excerpt || "",
      slug: post.slug || "",
      publishedAt: post.publishedAt,
      createdAt: post._createdAt,
      featuredImage: post.featuredImage
        ? (() => {
            const imageUrl = urlFor(post.featuredImage);
            return imageUrl ? imageUrl.width(800).url() : undefined;
          })()
        : undefined,
      readingTime: post.content
        ? calculateReadingTime(post.content)
        : undefined,
      // Note: viewCount is not available in the current BlogPost type
      // You may need to add this field to your Sanity schema if needed
      viewCount: undefined,
    }));

    return {
      items,
      total: filteredPosts.length,
    };
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    // Return empty result on error to prevent build failures
    return {
      items: [],
      total: 0,
    };
  }
}
