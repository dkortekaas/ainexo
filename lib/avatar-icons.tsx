import {
  MessageCircle,
  Bot,
  User,
  Headphones,
  HelpCircle,
  Sparkles,
  Zap,
  Heart,
  Star,
  Rocket,
  Lightbulb,
  Shield,
  Coffee,
  BookOpen,
  Settings,
  MessageSquare,
  Users,
  Smile,
  Briefcase,
  GraduationCap,
  ShoppingCart,
  Home,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface IconOption {
  id: string;
  icon: LucideIcon;
  name: string;
}

// Avatar iconen - voor gebruik in chat berichten en header
export const avatarOptions: IconOption[] = [
  { id: "chat-bubble", icon: MessageCircle, name: "Chat Bubble" },
  { id: "message-square", icon: MessageSquare, name: "Message" },
  { id: "user", icon: User, name: "User" },
  { id: "users", icon: Users, name: "Users" },
  { id: "smile", icon: Smile, name: "Smile" },
  { id: "support", icon: Headphones, name: "Support" },
  { id: "help", icon: HelpCircle, name: "Help" },
  { id: "sparkles", icon: Sparkles, name: "Sparkles" },
  { id: "heart", icon: Heart, name: "Heart" },
  { id: "star", icon: Star, name: "Star" },
  { id: "lightbulb", icon: Lightbulb, name: "Lightbulb" },
  { id: "shield", icon: Shield, name: "Shield" },
  { id: "coffee", icon: Coffee, name: "Coffee" },
  { id: "book", icon: BookOpen, name: "Book" },
  { id: "briefcase", icon: Briefcase, name: "Briefcase" },
];

// Assistant iconen - voor gebruik in floating button en toggle button
export const assistantIconOptions: IconOption[] = [
  { id: "robot", icon: Bot, name: "Robot" },
  { id: "chat-bubble", icon: MessageCircle, name: "Chat Bubble" },
  { id: "message-square", icon: MessageSquare, name: "Message" },
  { id: "zap", icon: Zap, name: "Zap" },
  { id: "rocket", icon: Rocket, name: "Rocket" },
  { id: "sparkles", icon: Sparkles, name: "Sparkles" },
  { id: "star", icon: Star, name: "Star" },
  { id: "lightbulb", icon: Lightbulb, name: "Lightbulb" },
  { id: "heart", icon: Heart, name: "Heart" },
  { id: "shield", icon: Shield, name: "Shield" },
  { id: "settings", icon: Settings, name: "Settings" },
  { id: "graduation-cap", icon: GraduationCap, name: "Graduation Cap" },
  { id: "shopping-cart", icon: ShoppingCart, name: "Shopping Cart" },
  { id: "home", icon: Home, name: "Home" },
  { id: "phone", icon: Phone, name: "Phone" },
  { id: "mail", icon: Mail, name: "Mail" },
  { id: "globe", icon: Globe, name: "Globe" },
];

export function getAvatarIcon(avatarId: string): IconOption | undefined {
  return avatarOptions.find((option) => option.id === avatarId);
}

export function getAssistantIcon(iconId: string): IconOption | undefined {
  return assistantIconOptions.find((option) => option.id === iconId);
}

export function getDefaultAvatar(): IconOption {
  return avatarOptions[0];
}

export function getDefaultAssistantIcon(): IconOption {
  return assistantIconOptions[0];
}
