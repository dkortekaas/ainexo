export const metadata = {
  title: "Sanity Studio",
};

// Disable static generation for the studio
export const dynamic = "force-dynamic";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
