import { PortableTextRenderer } from "@/components/blog/PortableTextRenderer";

interface TextSectionProps {
  heading?: string;
  content?: any[];
}

export const TextSection = ({ heading, content }: TextSectionProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      {heading && (
        <h2 className="font-display text-3xl font-bold text-foreground mb-8">
          {heading}
        </h2>
      )}
      {content && <PortableTextRenderer value={content} />}
    </div>
  );
};
