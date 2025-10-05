"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import React, { Suspense } from "react";
import SignInPageClient from "./SignInPageClient";

export default function Page() {
  return (
    <Suspense>
      <SignInPageClient />
    </Suspense>
  );
}
