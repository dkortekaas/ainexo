import { useTranslations } from "next-intl";

const logos = [
  { name: "Company 1", width: 120 },
  { name: "Company 2", width: 100 },
  { name: "Company 3", width: 110 },
  { name: "Company 4", width: 90 },
  { name: "Company 5", width: 130 },
  { name: "Company 6", width: 100 },
];

export const TrustedBySection = () => {
  const t = useTranslations("trustedBy");
  return (
    <section className="py-16 border-y border-border bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8">
          {t("title")}
        </p>

        {/* Logo carousel */}
        <div className="relative overflow-hidden">
          <div className="flex gap-12 items-center justify-center flex-wrap">
            {logos.map((logo, index) => (
              <div
                key={index}
                className="flex items-center justify-center h-12 opacity-40 hover:opacity-70 transition-opacity duration-300"
                style={{ width: logo.width }}
              >
                <div className="h-8 w-full bg-muted-foreground/30 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
