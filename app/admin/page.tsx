import type { Metadata } from "next";
import { ENABLE_DB } from "@/lib/env";
import { DbPlaceholder } from "@/components/db-placeholder";
import { AdminClient } from "./admin-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  if (!ENABLE_DB) return <DbPlaceholder feature="Admin" path="/admin" />;
  return <AdminClient />;
}
