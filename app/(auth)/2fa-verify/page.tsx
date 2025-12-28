// app/(auth)/2fa-verify/page.tsx
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TwoFactorVerifyClient from "./TwoFactorVerifyClient";

export default async function TwoFactorVerifyPage() {
  const session = await getAuthSession();

  if (!session?.user?.requires2FA) {
    redirect("/");
  }

  return <TwoFactorVerifyClient />;
}
