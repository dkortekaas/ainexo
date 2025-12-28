import Image from "next/image";
import { TeamMember } from "@/sanity/lib/page";

interface TeamSectionProps {
  heading?: string;
  description?: string;
  teamMembers?: TeamMember[];
}

export const TeamSection = ({
  heading = "Our Team",
  description,
  teamMembers = [],
}: TeamSectionProps) => {
  return (
    <div>
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="font-display text-3xl font-bold text-foreground mb-4">
          {heading}
        </h2>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="text-center group"
          >
            {member.imageUrl ? (
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden">
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-4xl font-bold">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            )}

            <h3 className="font-display text-xl font-semibold text-foreground mb-1">
              {member.name}
            </h3>

            {member.role && (
              <p className="text-primary font-medium mb-3">{member.role}</p>
            )}

            {member.bio && (
              <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
            )}

            {member.socialLinks && (
              <div className="flex justify-center gap-4">
                {member.socialLinks.linkedin && (
                  <a
                    href={member.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
                {member.socialLinks.twitter && (
                  <a
                    href={member.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Twitter
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
