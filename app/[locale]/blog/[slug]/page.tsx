import { getBlogPost, getBlogPosts } from "@/sanity/lib/blog";
import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = await getBlogPost(slug, locale);

  if (!post) {
    return {
      title: "Post Not Found | Ainexo Blog",
    };
  }

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    keywords: post.seo?.keywords,
    openGraph: post.mainImageUrl
      ? {
          images: [post.mainImageUrl],
        }
      : undefined,
  };
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, locale } = await params;
  const post = await getBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

      {/* Article Header */}
      <article className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.categories.map((category) => (
                  <Link
                    key={category.slug.current}
                    href={`/blog/category/${category.slug.current}`}
                  >
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary/10 transition-colors"
                      style={
                        category.color
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
            )}

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8 pb-8 border-b border-border">
              {/* Author */}
              {post.author && (
                <div className="flex items-center gap-3">
                  {post.author.imageUrl ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={post.author.imageUrl}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {post.author.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {post.author.name}
                    </p>
                    {post.author.role && (
                      <p className="text-sm">{post.author.role}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Published Date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.publishedAt}>{formattedDate}</time>
              </div>

              {/* Read Time */}
              {post.readTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime} min read</span>
                </div>
              )}
            </div>

            {/* Featured Image */}
            {post.mainImageUrl && (
              <div className="relative w-full h-96 rounded-2xl overflow-hidden mb-12">
                <Image
                  src={post.mainImageUrl}
                  alt={post.mainImageAlt || post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {post.body && <PortableTextRenderer value={post.body} />}
            </div>

            {/* Author Bio */}
            {post.author && post.author.bio && (
              <div className="mt-16 p-8 rounded-2xl bg-secondary/30 border border-border">
                <div className="flex items-start gap-4">
                  {post.author.imageUrl ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={post.author.imageUrl}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                      {post.author.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-lg mb-1">
                      {post.author.name}
                    </p>
                    {post.author.role && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {post.author.role}
                      </p>
                    )}
                    <p className="text-muted-foreground">{post.author.bio}</p>
                    {post.author.socialLinks && (
                      <div className="flex gap-4 mt-4">
                        {post.author.socialLinks.twitter && (
                          <a
                            href={post.author.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            Twitter
                          </a>
                        )}
                        {post.author.socialLinks.linkedin && (
                          <a
                            href={post.author.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            LinkedIn
                          </a>
                        )}
                        {post.author.socialLinks.github && (
                          <a
                            href={post.author.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
