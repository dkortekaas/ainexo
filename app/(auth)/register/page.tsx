// app/(auth)/register/page.tsx
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await getAuthSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
