import { Upload, Wand2, Globe, LucideIcon } from "lucide-react";
import { getHowItWorksSteps } from "@/sanity/lib/homepage";

// Icon mapping for Sanity string values
const iconMap: Record<string, LucideIcon> = {
  Upload,
  Wand2,
  Globe,
};

// Default fallback data
const defaultSteps = [
  {
    _id: "default-1",
    icon: "Upload",
    step: "01",
    title: "Connect your data",
    description:
      "Upload your documents, connect your website, or integrate with your existing helpdesk. Ainexo automatically indexes everything.",
    order: 1,
  },
  {
    _id: "default-2",
    icon: "Wand2",
    step: "02",
    title: "Customize your agent",
    description:
      "Define your chatbot's personality, tone, and behavior. Set up custom greetings and configure how it handles different types of queries.",
    order: 2,
  },
  {
    _id: "default-3",
    icon: "Globe",
    step: "03",
    title: "Deploy everywhere",
    description:
      "Add Ainexo to your website with a simple embed code. Your AI agent is now live and ready to help your customers 24/7.",
    order: 3,
  },
];

export const HowItWorksSection = async ({ locale }: { locale: string }) => {
  let steps = defaultSteps;

  try {
    const sanitySteps = await getHowItWorksSteps(locale);
    if (sanitySteps && sanitySteps.length > 0) {
      steps = sanitySteps;
    }
  } catch (error) {
    console.error("Error fetching how it works steps from Sanity:", error);
  }
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            How it works
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Get started in <span className="text-gradient">3 simple steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No technical skills required. Set up your AI chatbot in minutes, not
            days.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const IconComponent = iconMap[step.icon] || Upload;
            return (
              <div key={step._id || index} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}

                <div className="relative text-center">
                  {/* Step number */}
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-card border border-border shadow-card mb-6 relative group hover:border-primary/30 hover:shadow-soft transition-all duration-300">
                    <IconComponent className="w-12 h-12 text-primary" />
                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
