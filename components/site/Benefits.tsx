// components/home/Benefits.tsx
import { Camera, Edit, Check, Euro, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "../ui";

export default function Benefits() {
  const t = useTranslations("benefits");

  const benefits = [
    "Bespaar tot 60% op klantenservice kosten",
    "Verhoog conversie met 40% door 24/7 beschikbaarheid",
    "Antwoord binnen seconden, niet uren",
    "Schaal moeiteloos naar duizenden gelijktijdige gesprekken",
    "Leer automatisch van elke interactie",
    "Integreer met uw bestaande systemen",
  ];

  return (
    <section className="py-24 bg-primary/20" aria-labelledby="benefits-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Benefits list */}
          <div className="animate-fade-in-up">
            <h2
              id="benefits-heading"
              className="text-4xl sm:text-5xl font-bold text-foreground mb-6"
            >
              Transformeer uw{" "}
              <span className="text-primary">klantbeleving</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Ainexo helpt bedrijven zoals het uwe om sneller te groeien en
              klanten beter te bedienen.
            </p>

            <ul className="space-y-4 mb-10" role="list">
              {benefits.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle2
                    className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="text-lg text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="bg-primary hover:bg-primary-dark text-primary-foreground font-semibold shadow-glow"
            >
              Start Gratis Proefperiode
            </Button>
          </div>

          {/* Right column - Stats card */}
          <div
            className="relative animate-scale-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
              <h3 className="text-2xl font-bold text-card-foreground mb-8">
                Resultaten die spreken
              </h3>

              <div className="space-y-8">
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-primary">60%</span>
                    <span className="text-2xl text-muted-foreground">
                      besparing
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Lagere klantenservice kosten binnen 3 maanden
                  </p>
                </div>

                <div className="h-px bg-border" role="separator" />

                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-secondary">
                      40%
                    </span>
                    <span className="text-2xl text-muted-foreground">meer</span>
                  </div>
                  <p className="text-muted-foreground">
                    Conversie door snellere responstijden
                  </p>
                </div>

                <div className="h-px bg-border" role="separator" />

                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-accent">98%</span>
                    <span className="text-2xl text-muted-foreground">
                      score
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Gemiddelde klanttevredenheid rating
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground italic">
                  &quot;Ainexo heeft onze klantenservice volledig&quot;
                  getransformeerd. We bereiken nu meer klanten met minder
                  personeel.&quot;
                </p>
                <p className="text-sm font-semibold text-foreground mt-2">
                  — Sarah van de Berg, CEO TechStart BV
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
