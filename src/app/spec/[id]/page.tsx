import Link from "next/link";
import { ensureDb, getDb } from "@/lib/db";
import type { Spec } from "@/lib/spec-types";
import SpecView from "@/components/SpecView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SpecRow {
  id: string;
  title: string;
  summary: string;
  input_type: string;
  target_platform: string;
  spec: Spec;
  created_at: string;
}

export default async function SpecPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  if (!id || id.length > 64) {
    return <NotFound />;
  }

  let row: SpecRow | null = null;
  try {
    await ensureDb();
    const db = getDb();
    const rows = (await db`
      SELECT id, title, summary, input_type, target_platform, spec, created_at
      FROM sf_specs WHERE id = ${id}
    `) as SpecRow[];
    row = rows[0] ?? null;
  } catch (err) {
    console.error("Spec page DB error", err);
  }

  if (!row) return <NotFound />;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            SF
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">SpecForge</div>
            <div className="text-xs text-gray-500 -mt-0.5">Shared spec</div>
          </div>
        </Link>
        <Link href="/" className="tab">+ New spec</Link>
      </header>

      <SpecView spec={row.spec} id={row.id} />

      <footer className="mt-12 text-xs text-gray-600 text-center">
        Generated{" "}
        {new Date(row.created_at).toLocaleString("en-GB", { dateStyle: "medium" })}.{" "}
        <Link href="/" className="underline">Generate your own</Link>.
      </footer>
    </main>
  );
}

function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">Spec not found</h1>
      <p className="text-gray-400 mb-6">
        The spec you are looking for does not exist or has expired.
      </p>
      <Link href="/" className="btn btn-primary">Generate a new spec</Link>
    </main>
  );
}
