import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // Await de searchParams
  const params = await searchParams;

  return <VerifyEmailForm token={params.token} />;
}

