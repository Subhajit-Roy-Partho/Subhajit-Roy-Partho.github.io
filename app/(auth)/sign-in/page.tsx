import type { Metadata } from "next";
import { ENABLE_DB } from "@/lib/env";
import { AuthForm } from "@/components/auth-form";
import { DbPlaceholder } from "@/components/db-placeholder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  if (!ENABLE_DB) return <DbPlaceholder feature="Sign in" path="/sign-in" />;
  return <AuthForm mode="sign-in" />;
}
