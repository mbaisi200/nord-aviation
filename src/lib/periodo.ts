import { cache } from "react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { aeronaves, PERIODO_MANUAL } from "@/db/schema";

export const periodoAtual = cache(async () => {
  const [r] = await db
    .select({ p: sql<string>`max(periodo)` })
    .from(aeronaves)
    .where(sql`periodo <> ${PERIODO_MANUAL}`);
  return r?.p ?? null;
});

export { PERIODO_MANUAL };