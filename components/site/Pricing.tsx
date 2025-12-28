import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPricingPlans } from "@/sanity/lib/homepage";

// Default fallback data
const defaultPlans = [
  {
    _id: "default-1",
    name: "Starter",
    price: "29",
    currency: "$",
    period: "/month",
    description: "Perfect for small websites and personal projects",
    features: [
      "1 AI Agent",
      "1,000 messages/month",
      "Basic customization",
      "Email support",
      "Website widget",
    ],
    popular: false,
    ctaText: "Get Started",
    ctaLink: "#",
    order: 1,
  },
  {
    _id: "default-2",
    name: "Professional",
    price: "99",
    currency: "$",
    period: "/month",
    description: "For growing businesses with more traffic",
    features: [
      "5 AI Agents",
      "10,000 messages/month",
      "Full customization",
      "Priority support",
      "Analytics dashboard",
      "Team collaboration",
      "API access",
    ],
    popular: true,
    ctaText: "Get Started",
    ctaLink: "#",
    order: 2,
  },
  {
    _id: "default-3",
    name: "Enterprise",
    price: "Custom",
    currency: "",
    period: "",
    description: "For large organizations with specific needs",
    features: [
      "Unlimited AI Agents",
      "Unlimited messages",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
      "Custom training",
    ],
    popular: false,
    ctaText: "Contact Sales",
    ctaLink: "#",
    order: 3,
  },
];

export const PricingSection = async ({ locale }: { locale: string }) => {
  let plans = defaultPlans;

  try {
    const sanityPlans = await getPricingPlans(locale);
    if (sanityPlans && sanityPlans.length > 0) {
      plans = sanityPlans;
    }
  } catch (error) {
    console.error("Error fetching pricing plans from Sanity:", error);
  }
  return (
    <section id="pricing" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Simple, transparent <span className="text-gradient">pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start for free, upgrade as you grow. No hidden fees.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan._id || index}
              className={`relative p-8 rounded-2xl bg-card border transition-all duration-300 ${
                plan.popular
                  ? "border-primary shadow-glow scale-105 z-10"
                  : "border-border hover:border-primary/30 hover:shadow-soft"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-8">
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  {plan.currency && (
                    <span className="text-muted-foreground">
                      {plan.currency}
                    </span>
                  )}
                  <span className="font-display text-5xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full"
                size="lg"
                asChild
              >
                <a href={plan.ctaLink}>{plan.ctaText}</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
