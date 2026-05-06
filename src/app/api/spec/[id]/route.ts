import { NextRequest, NextResponse } from "next/server";
import { ensureDb, getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!id || id.length > 64) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await ensureDb();
    const db = getDb();
    const rows = (await db`
      SELECT id, title, summary, input_type, target_platform, spec, created_at
      FROM sf_specs WHERE id = ${id}
    `) as Array<{
      id: string;
      title: string;
      summary: string;
      input_type: string;
      target_platform: string;
      spec: unknown;
      created_at: string;
    }>;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/spec/[id] failed:", message);
    return NextResponse.json({ error: "Failed to load spec" }, { status: 500 });
  }
}
