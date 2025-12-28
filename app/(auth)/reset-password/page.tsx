import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // Await de searchParams
  const params = await searchParams;

  return <ResetPasswordForm token={params.token} />;
}
