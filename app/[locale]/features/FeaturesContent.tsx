"use client";
import { useState } from "react";
import {
  Database,
  Palette,
  Brain,
  Shield,
  Zap,
  BarChart3,
  MessageSquare,
  Globe,
  Users,
  Settings,
  Search,
  Lock,
  Workflow,
  HeadphonesIcon,
  FileText,
  Bot,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = [
  { id: "all", name: "All Features", count: 24 },
  { id: "chatbot", name: "Chatbot Features", count: 4 },
  { id: "knowledge", name: "Knowledge Sources", count: 4 },
  { id: "conversation", name: "Conversation & UX", count: 4 },
  { id: "integrations", name: "Integrations", count: 4 },
  { id: "analytics", name: "Analytics", count: 4 },
  { id: "security", name: "Security & Compliance", count: 4 },
];

const features = [
  // Chatbot Features
  {
    category: "chatbot",
    icon: Bot,
    title: "AI-Powered Responses",
    description:
      "Get instant, accurate answers powered by advanced AI that understands context and intent.",
    tier: "Starter",
  },
  {
    category: "chatbot",
    icon: MessageSquare,
    title: "Multi-turn Conversations",
    description:
      "Natural conversations with context awareness across multiple messages.",
    tier: "Starter",
  },
  {
    category: "chatbot",
    icon: Globe,
    title: "Multilingual Support",
    description: "Communicate with customers in 100+ languages automatically.",
    tier: "Basic",
  },
  {
    category: "chatbot",
    icon: Zap,
    title: "Instant Deployment",
    description: "Deploy your chatbot in minutes with a simple embed code.",
    tier: "Starter",
  },
  // Knowledge Sources
  {
    category: "knowledge",
    icon: Database,
    title: "Train on Documents",
    description:
      "Upload PDFs, Word docs, and more to train your chatbot on your content.",
    tier: "Starter",
  },
  {
    category: "knowledge",
    icon: Globe,
    title: "Website Crawling",
    description:
      "Automatically index and learn from your entire website content.",
    tier: "Starter",
  },
  {
    category: "knowledge",
    icon: FileText,
    title: "Help Center Integration",
    description: "Connect to Zendesk, Intercom, and other help desk systems.",
    tier: "Professional",
  },
  {
    category: "knowledge",
    icon: Brain,
    title: "Real-time Learning",
    description:
      "Continuously improve responses based on feedback and corrections.",
    tier: "Professional",
  },
  // Conversation & UX
  {
    category: "conversation",
    icon: Palette,
    title: "Custom Branding",
    description: "Match your brand colors, fonts, and style perfectly.",
    tier: "Starter",
  },
  {
    category: "conversation",
    icon: MessageSquare,
    title: "Custom Welcome Messages",
    description: "Personalized greetings based on page, user, or time of day.",
    tier: "Starter",
  },
  {
    category: "conversation",
    icon: Settings,
    title: "Conversation Flows",
    description: "Design custom conversation paths for specific use cases.",
    tier: "Professional",
  },
  {
    category: "conversation",
    icon: Users,
    title: "Human Handoff",
    description: "Seamlessly transfer complex queries to human agents.",
    tier: "Professional",
  },
  // Integrations
  {
    category: "integrations",
    icon: Workflow,
    title: "Slack Integration",
    description: "Get notified and respond to chats directly from Slack.",
    tier: "Basic",
  },
  {
    category: "integrations",
    icon: HeadphonesIcon,
    title: "Zendesk Integration",
    description: "Sync conversations and tickets with your Zendesk account.",
    tier: "Professional",
  },
  {
    category: "integrations",
    icon: Globe,
    title: "WhatsApp Business",
    description: "Connect your chatbot to WhatsApp for wider reach.",
    tier: "Professional",
  },
  {
    category: "integrations",
    icon: Settings,
    title: "API Access",
    description: "Full API access for custom integrations and workflows.",
    tier: "Professional",
  },
  // Analytics
  {
    category: "analytics",
    icon: BarChart3,
    title: "Conversation Analytics",
    description:
      "Track resolution rates, response times, and customer satisfaction.",
    tier: "Starter",
  },
  {
    category: "analytics",
    icon: Search,
    title: "Query Insights",
    description: "Understand what customers are asking most frequently.",
    tier: "Basic",
  },
  {
    category: "analytics",
    icon: Brain,
    title: "Knowledge Gap Detection",
    description:
      "Automatically identify topics where your chatbot needs more training.",
    tier: "Professional",
  },
  {
    category: "analytics",
    icon: Users,
    title: "Customer Journey Tracking",
    description: "See how customers interact across multiple sessions.",
    tier: "Professional",
  },
  // Security & Compliance
  {
    category: "security",
    icon: Shield,
    title: "GDPR Compliant",
    description: "Full compliance with European data protection regulations.",
    tier: "Starter",
  },
  {
    category: "security",
    icon: Lock,
    title: "SOC 2 Certified",
    description: "Enterprise-grade security with SOC 2 Type II certification.",
    tier: "Basic",
  },
  {
    category: "security",
    icon: Shield,
    title: "End-to-End Encryption",
    description: "All data encrypted in transit and at rest.",
    tier: "Starter",
  },
  {
    category: "security",
    icon: Users,
    title: "Role-Based Access",
    description: "Control who can access and manage your chatbot.",
    tier: "Professional",
  },
];

const tierColors: Record<string, string> = {
  Starter:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Basic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Professional:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const FeaturesContent = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFeatures = features.filter((feature) => {
    const matchesCategory =
      activeCategory === "all" || feature.category === activeCategory;
    const matchesSearch =
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-accent/50 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Ainexo Features
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            From quick setup to smart routing and customization, Ainexo delivers
            real-world conversational support to elevate your customer
            experience.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full border-border bg-background"
            />
          </div>
        </div>
      </section>

      {/* Features Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <h3 className="font-semibold text-foreground mb-4">
                Categories:
              </h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span
                      className={`text-sm ${
                        activeCategory === category.id
                          ? "text-primary"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Features Grid */}
            <div className="flex-1">
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-8">
                <span className="text-muted-foreground">Ainexo Features /</span>
                <span className="font-medium text-foreground">
                  {categories.find((c) => c.id === activeCategory)?.name}
                </span>
                <div className="flex-1" />
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    Starter
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Basic
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    Professional
                  </span>
                </div>
              </div>

              {/* Features Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {filteredFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300"
                  >
                    {/* Tier Badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${tierColors[feature.tier]}`}
                      >
                        {feature.tier}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow duration-300">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>

                    {/* Content */}
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2 pr-20">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {filteredFeatures.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No features found matching your search.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesContent;
