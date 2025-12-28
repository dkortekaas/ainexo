import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await getAuthSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <ForgotPasswordForm />;
}
