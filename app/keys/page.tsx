import type { Metadata } from "next";
import { ENABLE_DB } from "@/lib/env";
import { DbPlaceholder } from "@/components/db-placeholder";
import { KeysClient } from "./keys-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "API keys" };

export default function KeysPage() {
  if (!ENABLE_DB) return <DbPlaceholder feature="API keys" path="/keys" />;
  return <KeysClient />;
}
