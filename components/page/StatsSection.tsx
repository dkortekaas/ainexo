import { Stat } from "@/sanity/lib/page";
import { TrendingUp, Users, CheckCircle, Zap, LucideIcon } from "lucide-react";

interface StatsSectionProps {
  heading?: string;
  stats?: Stat[];
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Users,
  CheckCircle,
  Zap,
};

export const StatsSection = ({
  heading = "By the Numbers",
  stats = [],
}: StatsSectionProps) => {
  return (
    <div>
      {heading && (
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
          {heading}
        </h2>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon ? iconMap[stat.icon] : TrendingUp;
          return (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300"
            >
              {IconComponent && (
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="font-display text-4xl font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
