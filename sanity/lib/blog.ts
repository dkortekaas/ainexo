import { client } from "../client";
import {
  blogPostsQuery,
  blogPostQuery,
  blogCategoriesQuery,
  blogPostsByCategoryQuery,
} from "../queries";

// Types
export interface BlogCategory {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  color?: string;
}

export interface BlogAuthor {
  name: string;
  slug: { current: string };
  imageUrl?: string;
  bio?: string;
  role?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImageUrl?: string;
  mainImageAlt?: string;
  categories?: BlogCategory[];
  author: BlogAuthor;
  publishedAt: string;
  body?: any[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  featured?: boolean;
  readTime?: number;
}

// Fetch functions
export async function getBlogPosts(locale: string): Promise<BlogPost[]> {
  return client.fetch(blogPostsQuery, { locale }, { next: { revalidate: 60 } });
}

export async function getBlogPost(
  slug: string,
  locale: string
): Promise<BlogPost | null> {
  return client.fetch(
    blogPostQuery,
    { slug, locale },
    { next: { revalidate: 60 } }
  );
}

export async function getBlogCategories(
  locale: string
): Promise<BlogCategory[]> {
  return client.fetch(
    blogCategoriesQuery,
    { locale },
    { next: { revalidate: 60 } }
  );
}

export async function getBlogPostsByCategory(
  slug: string,
  locale: string
): Promise<BlogPost[]> {
  return client.fetch(
    blogPostsByCategoryQuery,
    { slug, locale },
    { next: { revalidate: 60 } }
  );
}

export async function getFeaturedBlogPosts(
  locale: string
): Promise<BlogPost[]> {
  const posts = await getBlogPosts(locale);
  return posts.filter((post) => post.featured);
}
