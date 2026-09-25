import type { Metadata } from "next";
import { ENABLE_DB } from "@/lib/env";
import { DbPlaceholder } from "@/components/db-placeholder";
import { VaultClient } from "./vault-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Vault" };

export default function VaultPage() {
  if (!ENABLE_DB) return <DbPlaceholder feature="Vault" path="/vault" />;
  return <VaultClient />;
}
