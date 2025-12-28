import {
  Database,
  Palette,
  Brain,
  Shield,
  Zap,
  BarChart3,
  LucideIcon,
} from "lucide-react";
import { getFeatures } from "@/sanity/lib/fetch";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Database,
  Palette,
  Brain,
  Shield,
  Zap,
  BarChart3,
};

// Default fallback features
const defaultFeatures = [
  {
    icon: "Database",
    title: "Train AI Agents on your data",
    description:
      "Upload documentation and integrate with help desk systems. Ainexo learns from PDFs, URLs, Zendesk, and other sources to provide accurate responses.",
    benefits: [
      "Train on all file formats",
      "Index unlimited websites",
      "Sync your data automatically",
    ],
  },
  {
    icon: "Palette",
    title: "Fully customizable to fit your brand",
    description:
      "Customize your chatbot's role, tone, style, and write custom instructions to give your chatbot a behavior and personality.",
    benefits: [
      "Match your brand colors",
      "Custom greetings",
      "Personalized responses",
    ],
  },
  {
    icon: "Brain",
    title: "Train Chatbot on real-time conversations",
    description:
      "Don't like a response your chatbot is giving out? Train your chatbot to learn from its mistakes by informing it of what is a model answer.",
    benefits: [
      "Add corrections on the go",
      "Smarter responses over time",
      "Automated correction identification",
    ],
  },
  {
    icon: "Shield",
    title: "GDPR Compliant & SOC 2 Certified",
    description:
      "Industry-grade compliance ensures your data is protected with enterprise-level security standards.",
    benefits: [
      "End-to-end encryption",
      "Data privacy controls",
      "Regular security audits",
    ],
  },
  {
    icon: "Zap",
    title: "Super fast, 5-minute setup",
    description:
      "5 minutes is all it takes for the Chatbot to train on your website and files. Once done, you can instantly converse with it.",
    benefits: ["No coding required", "Instant deployment", "Easy integration"],
  },
  {
    icon: "BarChart3",
    title: "Built-in Analytics Dashboard",
    description:
      "Track every metric that matters in one powerful dashboard that quantifies your chatbot's ROI and reveals exactly where to optimize.",
    benefits: [
      "Resolution rate tracking",
      "Customer query summaries",
      "Knowledge gap analysis",
    ],
  },
];

export const FeaturesSection = async () => {
  let features: Array<{
    icon: string;
    title: string;
    description: string;
    benefits: string[];
  }> = defaultFeatures;

  try {
    const sanityFeatures = await getFeatures();
    if (sanityFeatures && sanityFeatures.length > 0) {
      features = sanityFeatures;
    }
  } catch (error) {
    console.error("Error fetching features from Sanity:", error);
    // Fall back to default features
  }

  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything you need to{" "}
            <span className="text-gradient">supercharge</span> your support
          </h2>
          <p className="text-lg text-muted-foreground">
            Ainexo provides all the tools you need to deliver exceptional
            customer experiences at scale.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Database;
            return (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:shadow-glow transition-shadow duration-300">
                  <IconComponent className="w-6 h-6 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {feature.description}
                </p>

                {/* Benefits */}
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
