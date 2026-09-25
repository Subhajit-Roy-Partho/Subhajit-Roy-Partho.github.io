import type { Metadata } from "next";
import { ENABLE_DB } from "@/lib/env";
import { AuthForm } from "@/components/auth-form";
import { DbPlaceholder } from "@/components/db-placeholder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  if (!ENABLE_DB) return <DbPlaceholder feature="Sign up" path="/sign-up" />;
  return <AuthForm mode="sign-up" />;
}
