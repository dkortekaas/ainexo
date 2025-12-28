export interface Feature {
  icon: any;
  title: string;
  description: string;
}

export interface TestimonialType {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
}
