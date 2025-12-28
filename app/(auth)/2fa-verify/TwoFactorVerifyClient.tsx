"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TwoFactorVerification from "@/components/auth/TwoFactorVerification";

function TwoFactorVerifyContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return <TwoFactorVerification callbackUrl={callbackUrl} />;
}

export default function TwoFactorVerifyClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TwoFactorVerifyContent />
    </Suspense>
  );
}
