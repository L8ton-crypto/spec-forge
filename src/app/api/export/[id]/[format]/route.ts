import { NextRequest, NextResponse } from "next/server";
import { ensureDb, getDb } from "@/lib/db";
import {
  toCursorTasks,
  toAppianBpm,
  toLinearMarkdown,
  toJson,
} from "@/lib/exporters";
import type { Spec } from "@/lib/spec-types";

export const runtime = "nodejs";

const FORMATS = new Set(["cursor", "appian", "linear", "json"]);

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; format: string }> },
) {
  try {
    const { id, format } = await ctx.params;
    if (!id || id.length > 64) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    if (!FORMATS.has(format)) {
      return NextResponse.json(
        { error: "Format must be one of: cursor, appian, linear, json" },
        { status: 400 },
      );
    }

    await ensureDb();
    const db = getDb();
    const rows = (await db`SELECT spec, title FROM sf_specs WHERE id = ${id}`) as Array<{
      spec: Spec;
      title: string;
    }>;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const spec = rows[0].spec;
    const slug = (rows[0].title || "spec")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "spec";

    let body: string;
    let contentType = "text/markdown; charset=utf-8";
    let filename = `${slug}.md`;

    switch (format) {
      case "cursor":
        body = toCursorTasks(spec);
        filename = `${slug}-cursor.md`;
        break;
      case "appian":
        body = toAppianBpm(spec);
        filename = `${slug}-appian.md`;
        break;
      case "linear":
        body = toLinearMarkdown(spec);
        filename = `${slug}-tickets.md`;
        break;
      case "json":
        body = toJson(spec);
        contentType = "application/json; charset=utf-8";
        filename = `${slug}.json`;
        break;
      default:
        body = toJson(spec);
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/export failed:", message);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
