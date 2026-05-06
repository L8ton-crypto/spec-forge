"use client";

import { useState } from "react";
import type { Spec } from "@/lib/spec-types";

interface Props {
  spec: Spec;
  id: string;
}

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "components", label: "Components" },
  { id: "data", label: "Data model" },
  { id: "process", label: "Process flow" },
  { id: "criteria", label: "Success criteria" },
  { id: "risks", label: "Risks & questions" },
];

type SectionId =
  | "overview"
  | "components"
  | "data"
  | "process"
  | "criteria"
  | "risks";

export default function SpecView({ spec, id }: Props) {
  const [section, setSection] = useState<SectionId>("overview");
  const [copied, setCopied] = useState<string | null>(null);

  const exportUrl = (format: string) => `/api/export/${id}/${format}`;

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    setCopied("json");
    setTimeout(() => setCopied(null), 1500);
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/spec/${id}` : "";

  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied("share");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <section className="panel p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="chip">{spec.targetPlatform}</span>
            <span className="chip-ok chip">spec ready</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{spec.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-ghost" href={exportUrl("cursor")}>Cursor / Claude Code</a>
          <a className="btn btn-ghost" href={exportUrl("appian")}>Appian build plan</a>
          <a className="btn btn-ghost" href={exportUrl("linear")}>Linear / Jira</a>
          <a className="btn btn-ghost" href={exportUrl("json")}>JSON</a>
          <button className="btn btn-ghost" onClick={copyJson}>
            {copied === "json" ? "Copied" : "Copy JSON"}
          </button>
          <button className="btn btn-ghost" onClick={copyShare}>
            {copied === "share" ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>

      <p className="text-gray-300 mb-5">{spec.summary}</p>

      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={`tab ${section === s.id ? "active" : ""}`}
            onClick={() => setSection(s.id)}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div>
        {section === "overview" && <Overview spec={spec} />}
        {section === "components" && <Components spec={spec} />}
        {section === "data" && <DataModel spec={spec} />}
        {section === "process" && <ProcessFlow spec={spec} />}
        {section === "criteria" && <Criteria spec={spec} />}
        {section === "risks" && <Risks spec={spec} />}
      </div>
    </section>
  );
}

function Overview({ spec }: { spec: Spec }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="panel-2 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Primary user</div>
        <div className="text-gray-200">{spec.primaryUser}</div>
      </div>
      <div className="panel-2 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Goal</div>
        <div className="text-gray-200">{spec.goal}</div>
      </div>
      <div className="panel-2 p-4 sm:col-span-2">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Non-functional notes
        </div>
        {spec.nonFunctional.length === 0 ? (
          <div className="text-gray-500 text-sm">None specified.</div>
        ) : (
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
            {spec.nonFunctional.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Components({ spec }: { spec: Spec }) {
  if (spec.components.length === 0) {
    return <Empty msg="No components extracted." />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {spec.components.map((c) => (
        <div key={c.name} className="panel-2 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold">{c.name}</div>
            <span className="chip">{c.kind}</span>
          </div>
          <div className="text-sm text-gray-400 mb-2">{c.purpose}</div>
          {c.fields && c.fields.length > 0 && (
            <div className="text-xs text-gray-500">
              <span className="text-gray-400">Fields: </span>
              {c.fields.join(", ")}
            </div>
          )}
          {c.actions && c.actions.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              <span className="text-gray-400">Actions: </span>
              {c.actions.join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DataModel({ spec }: { spec: Spec }) {
  if (spec.dataModel.length === 0) return <Empty msg="No data entities." />;
  return (
    <div className="space-y-4">
      {spec.dataModel.map((e) => (
        <div key={e.entity} className="panel-2 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold">{e.entity}</div>
            <span className="chip">{e.fields.length} fields</span>
          </div>
          <div className="text-sm text-gray-400 mb-3">{e.description}</div>
          <div className="text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="pb-2 pr-2">Field</th>
                  <th className="pb-2 pr-2">Type</th>
                  <th className="pb-2 pr-2 hide-mobile">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {e.fields.map((f) => (
                  <tr key={f.name}>
                    <td className="py-1.5 pr-2 font-mono text-xs">
                      {f.name}
                      {f.required ? <span className="text-red-400"> *</span> : null}
                    </td>
                    <td className="py-1.5 pr-2 text-gray-400 text-xs">{f.type}</td>
                    <td className="py-1.5 pr-2 text-gray-500 text-xs hide-mobile">
                      {f.notes || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {e.relations && e.relations.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              <span className="text-gray-400">Related to: </span>
              {e.relations.join(", ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProcessFlow({ spec }: { spec: Spec }) {
  if (spec.processFlow.length === 0) return <Empty msg="No process steps." />;
  return (
    <ol className="space-y-2">
      {spec.processFlow.map((s, idx) => (
        <li key={s.id} className="panel-2 p-3 flex gap-3">
          <div
            className="w-7 h-7 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
            style={{
              background: actorColour(s.actor),
              color: "white",
            }}
          >
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-gray-500">{s.id}</span>
              <span className="chip">{s.actor}</span>
            </div>
            <div className="text-gray-200 text-sm">{s.action}</div>
            {(s.inputs?.length || s.outputs?.length || s.decisions?.length) ? (
              <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                {s.inputs && s.inputs.length > 0 && (
                  <div><span className="text-gray-400">In:</span> {s.inputs.join(", ")}</div>
                )}
                {s.outputs && s.outputs.length > 0 && (
                  <div><span className="text-gray-400">Out:</span> {s.outputs.join(", ")}</div>
                )}
                {s.decisions && s.decisions.length > 0 && (
                  <div><span className="text-gray-400">Decisions:</span> {s.decisions.join(" / ")}</div>
                )}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function actorColour(actor: string): string {
  switch (actor) {
    case "user":
      return "linear-gradient(135deg, #6366f1, #a855f7)";
    case "system":
      return "linear-gradient(135deg, #0ea5e9, #06b6d4)";
    case "external":
      return "linear-gradient(135deg, #f59e0b, #ef4444)";
    case "agent":
      return "linear-gradient(135deg, #10b981, #14b8a6)";
    default:
      return "#374151";
  }
}

function Criteria({ spec }: { spec: Spec }) {
  if (spec.successCriteria.length === 0) return <Empty msg="No acceptance criteria." />;
  return (
    <div className="space-y-2">
      {spec.successCriteria.map((c) => (
        <div key={c.id} className="panel-2 p-4">
          <div className="text-xs font-mono text-gray-500 mb-2">{c.id}</div>
          <div className="text-sm">
            <div><span className="text-gray-500">Given </span><span className="text-gray-200">{c.given}</span></div>
            <div><span className="text-gray-500">When </span><span className="text-gray-200">{c.when}</span></div>
            <div><span className="text-gray-500">Then </span><span className="text-gray-200">{c.then}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Risks({ spec }: { spec: Spec }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="panel-2 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Risk flags
        </div>
        {spec.riskFlags.length === 0 ? (
          <div className="text-gray-500 text-sm">No risks flagged.</div>
        ) : (
          <ul className="space-y-2">
            {spec.riskFlags.map((r, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="chip-warn chip flex-shrink-0">risk</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="panel-2 p-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Open questions
        </div>
        {spec.openQuestions.length === 0 ? (
          <div className="text-gray-500 text-sm">Nothing pending.</div>
        ) : (
          <ul className="space-y-3">
            {spec.openQuestions.map((q, i) => (
              <li key={i} className="text-sm">
                <div className="text-gray-200">{q.question}</div>
                <div className="text-xs text-gray-500 mt-0.5">{q.why}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="text-gray-500 text-sm py-6 text-center">{msg}</div>;
}
