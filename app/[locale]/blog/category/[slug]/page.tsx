import { getBlogPostsByCategory, getBlogCategories } from "@/sanity/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const [posts, categories] = await Promise.all([
    getBlogPostsByCategory(slug, locale),
    getBlogCategories(locale),
  ]);

  const category = categories.find((c) => c.slug.current === slug);

  if (!category) {
    return {
      title: "Category Not Found | Ainexo Blog",
    };
  }

  return {
    title: `${category.title} | Ainexo Blog`,
    description:
      category.description || `Browse all articles in ${category.title}`,
  };
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug, locale } = await params;
  const [posts, categories] = await Promise.all([
    getBlogPostsByCategory(slug, locale),
    getBlogCategories(locale),
  ]);

  const currentCategory = categories.find((c) => c.slug.current === slug);

  if (!currentCategory) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Category Header */}
      <section className="pt-16 pb-8 bg-gradient-hero">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge
              variant="secondary"
              className="mb-4 text-base px-4 py-2"
              style={
                currentCategory.color
                  ? {
                      borderColor: currentCategory.color,
                      color: currentCategory.color,
                    }
                  : undefined
              }
            >
              {currentCategory.title}
            </Badge>
            {currentCategory.description && (
              <p className="text-lg text-muted-foreground">
                {currentCategory.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      {categories && categories.length > 0 && (
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/blog">
                <Badge
                  variant="outline"
                  className="hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  All Posts
                </Badge>
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug.current}
                  href={`/blog/category/${category.slug.current}`}
                >
                  <Badge
                    variant={
                      category.slug.current === slug ? "default" : "outline"
                    }
                    className="hover:bg-primary/10 transition-colors cursor-pointer"
                    style={
                      category.slug.current === slug && category.color
                        ? {
                            backgroundColor: category.color,
                            borderColor: category.color,
                          }
                        : category.color
                          ? {
                              borderColor: category.color,
                              color: category.color,
                            }
                          : undefined
                    }
                  >
                    {category.title}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {posts && posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No posts found in this category yet.
              </p>
              <Link
                href="/blog"
                className="inline-block mt-6 text-primary hover:underline"
              >
                View all posts
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
