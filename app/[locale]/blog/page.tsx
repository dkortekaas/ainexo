import {
  getBlogPosts,
  getFeaturedBlogPosts,
  getBlogCategories,
} from "@/sanity/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Ainexo",
  description:
    "Discover articles about AI agents, customer support automation, and building better chatbots.",
};

export const revalidate = 60; // Revalidate every 60 seconds

interface BlogPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const [allPosts, featuredPosts, categories] = await Promise.all([
    getBlogPosts(locale),
    getFeaturedBlogPosts(locale),
    getBlogCategories(locale),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-gradient-hero">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Insights & <span className="text-gradient">Resources</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Learn how to build better AI agents, improve customer support, and
              leverage automation for your business.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/blog">
                <Badge
                  variant="secondary"
                  className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
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
                    variant="outline"
                    className="hover:bg-primary/10 transition-colors cursor-pointer"
                    style={
                      category.color
                        ? { borderColor: category.color, color: category.color }
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

      {/* Featured Posts */}
      {featuredPosts && featuredPosts.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-foreground mb-8">
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-foreground mb-8">
            {featuredPosts && featuredPosts.length > 0
              ? "Latest Articles"
              : "All Articles"}
          </h2>
          {allPosts && allPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allPosts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No blog posts found. Check back soon for new content!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
