import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, User } from "lucide-react";
import { BlogPost } from "@/sanity/lib/blog";
import { Badge } from "@/components/ui/badge";

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = ({ post }: BlogCardProps) => {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="group h-full flex flex-col rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300 overflow-hidden">
      {/* Featured Image */}
      {post.mainImageUrl && (
        <Link href={`/blog/${post.slug.current}`} className="relative h-48 w-full overflow-hidden">
          <Image
            src={post.mainImageUrl}
            alt={post.mainImageAlt || post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col p-6">
        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.slice(0, 2).map((category) => (
              <Link key={category.slug.current} href={`/blog/category/${category.slug.current}`}>
                <Badge
                  variant="secondary"
                  className="hover:bg-primary/10 transition-colors"
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
        )}

        {/* Title */}
        <Link href={`/blog/${post.slug.current}`}>
          <h3 className="font-display text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
          {/* Author */}
          {post.author && (
            <div className="flex items-center gap-2">
              {post.author.imageUrl ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden">
                  <Image
                    src={post.author.imageUrl}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <User className="w-4 h-4" />
              )}
              <span>{post.author.name}</span>
            </div>
          )}

          {/* Published Date */}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <time dateTime={post.publishedAt}>{formattedDate}</time>
          </div>

          {/* Read Time */}
          {post.readTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
