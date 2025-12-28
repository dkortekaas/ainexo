import { Star } from "lucide-react";
import { getTestimonials, type Testimonial } from "@/sanity/lib/homepage";
import Image from "next/image";

// Default fallback data
const defaultTestimonials: Testimonial[] = [
  {
    _id: "default-1",
    quote:
      "Ainexo has revolutionized our customer support. We've reduced response time by 80% and our customers love the instant help.",
    author: "Sarah Johnson",
    role: "Head of Customer Success",
    company: "TechFlow Inc.",
    rating: 5,
    order: 1,
  },
  {
    _id: "default-2",
    quote:
      "The setup was incredibly easy. Within 5 minutes, we had an AI chatbot that actually understood our product documentation.",
    author: "Michael Chen",
    role: "Founder & CEO",
    company: "StartupLab",
    rating: 5,
    order: 2,
  },
  {
    _id: "default-3",
    quote:
      "The accuracy of responses is impressive. Our support team can now focus on complex issues while Ainexo handles the routine queries.",
    author: "Emily Rodriguez",
    role: "Support Manager",
    company: "CloudScale",
    rating: 5,
    order: 3,
  },
];

export const TestimonialsSection = async ({ locale }: { locale: string }) => {
  let testimonials = defaultTestimonials;

  try {
    const sanityTestimonials = await getTestimonials(locale);
    if (sanityTestimonials && sanityTestimonials.length > 0) {
      testimonials = sanityTestimonials;
    }
  } catch (error) {
    console.error("Error fetching testimonials from Sanity:", error);
  }
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Businesses with successful customer service start with{" "}
            <span className="text-gradient">Ainexo</span>
          </h2>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial._id || index}
              className="p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground text-lg mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                {testimonial.avatarUrl ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden relative">
                    <Image
                      src={testimonial.avatarUrl}
                      alt={testimonial.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
