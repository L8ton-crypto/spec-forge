import type { Spec } from "./spec-types";

// Export a spec as a Cursor / Claude Code task list (Markdown).
export function toCursorTasks(spec: Spec): string {
  const lines: string[] = [];
  lines.push(`# ${spec.title}`);
  lines.push("");
  lines.push(`> ${spec.summary}`);
  lines.push("");
  lines.push(`**Primary user:** ${spec.primaryUser}`);
  lines.push(`**Goal:** ${spec.goal}`);
  lines.push(`**Target platform:** ${spec.targetPlatform}`);
  lines.push("");
  lines.push("## Tasks");
  lines.push("");
  lines.push("### 1. Data model");
  for (const e of spec.dataModel) {
    lines.push(`- [ ] **${e.entity}**: ${e.description}`);
    for (const f of e.fields) {
      const req = f.required ? " (required)" : "";
      const notes = f.notes ? ` - ${f.notes}` : "";
      lines.push(`  - \`${f.name}\` ${f.type}${req}${notes}`);
    }
    if (e.relations && e.relations.length > 0) {
      lines.push(`  - Relations: ${e.relations.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("### 2. Components");
  for (const c of spec.components) {
    lines.push(`- [ ] **${c.name}** (${c.kind}) - ${c.purpose}`);
    if (c.fields && c.fields.length > 0) {
      lines.push(`  - Fields: ${c.fields.join(", ")}`);
    }
    if (c.actions && c.actions.length > 0) {
      lines.push(`  - Actions: ${c.actions.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("### 3. Process flow");
  for (const s of spec.processFlow) {
    lines.push(`- [ ] **${s.id}** [${s.actor}] ${s.action}`);
    if (s.inputs && s.inputs.length > 0) {
      lines.push(`  - Inputs: ${s.inputs.join(", ")}`);
    }
    if (s.outputs && s.outputs.length > 0) {
      lines.push(`  - Outputs: ${s.outputs.join(", ")}`);
    }
    if (s.decisions && s.decisions.length > 0) {
      lines.push(`  - Decisions: ${s.decisions.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("### 4. Acceptance criteria");
  for (const sc of spec.successCriteria) {
    lines.push(`- [ ] **${sc.id}**`);
    lines.push(`  - Given ${sc.given}`);
    lines.push(`  - When ${sc.when}`);
    lines.push(`  - Then ${sc.then}`);
  }
  lines.push("");
  if (spec.nonFunctional.length > 0) {
    lines.push("### 5. Non-functional");
    for (const n of spec.nonFunctional) lines.push(`- ${n}`);
    lines.push("");
  }
  if (spec.openQuestions.length > 0) {
    lines.push("### Open questions");
    for (const q of spec.openQuestions) {
      lines.push(`- **${q.question}** - ${q.why}`);
    }
    lines.push("");
  }
  if (spec.riskFlags.length > 0) {
    lines.push("### Risks");
    for (const r of spec.riskFlags) lines.push(`- ${r}`);
    lines.push("");
  }
  return lines.join("\n");
}

// Appian-flavoured BPMN. Not real BPMN XML (Appian uses its own .bpm format),
// but a Markdown outline mapped to Appian primitives so an Appian dev can
// translate it directly.
export function toAppianBpm(spec: Spec): string {
  const lines: string[] = [];
  lines.push(`# Appian Build Plan: ${spec.title}`);
  lines.push("");
  lines.push(`> ${spec.summary}`);
  lines.push("");
  lines.push("## Record types");
  for (const e of spec.dataModel) {
    lines.push(`- **${e.entity}** record type`);
    lines.push(`  - Description: ${e.description}`);
    lines.push("  - Fields:");
    for (const f of e.fields) {
      lines.push(
        `    - ${f.name} (${mapToAppianType(f.type)})${f.required ? " required" : ""}`,
      );
    }
    if (e.relations && e.relations.length > 0) {
      lines.push(`  - Related records: ${e.relations.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("## SAIL interfaces");
  for (const c of spec.components) {
    lines.push(`- **${c.name}** (${mapToAppianInterface(c.kind)})`);
    lines.push(`  - Purpose: ${c.purpose}`);
    if (c.fields && c.fields.length > 0) {
      lines.push(`  - Fields shown: ${c.fields.join(", ")}`);
    }
    if (c.actions && c.actions.length > 0) {
      lines.push(`  - Related actions: ${c.actions.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("## Process model");
  lines.push("");
  lines.push("```");
  lines.push("[Start]");
  for (const s of spec.processFlow) {
    const node = mapToAppianNode(s.actor);
    lines.push(`  -> [${node}: ${s.id}] ${s.action}`);
    if (s.decisions && s.decisions.length > 0) {
      for (const d of s.decisions) {
        lines.push(`     <Decision> ${d}`);
      }
    }
  }
  lines.push("[End]");
  lines.push("```");
  lines.push("");
  lines.push("## Acceptance criteria");
  for (const sc of spec.successCriteria) {
    lines.push(`- **${sc.id}**: Given ${sc.given}, when ${sc.when}, then ${sc.then}`);
  }
  return lines.join("\n");
}

function mapToAppianType(
  t: "text" | "number" | "date" | "datetime" | "boolean" | "enum" | "reference" | "json",
): string {
  switch (t) {
    case "text":
      return "Text";
    case "number":
      return "Number (Integer or Decimal)";
    case "date":
      return "Date";
    case "datetime":
      return "Date and Time";
    case "boolean":
      return "Boolean";
    case "enum":
      return "Text with constant ref";
    case "reference":
      return "Related record reference";
    case "json":
      return "Document or CDT";
  }
}

function mapToAppianInterface(kind: string): string {
  switch (kind) {
    case "page":
      return "Record list view or summary view";
    case "form":
      return "Start form or related action form";
    case "list":
      return "Read-only grid";
    case "modal":
      return "Related action dialog";
    case "card":
      return "Record header";
    case "navigation":
      return "Site nav";
    case "report":
      return "Report or record dashboard";
    default:
      return "SAIL interface";
  }
}

function mapToAppianNode(actor: string): string {
  switch (actor) {
    case "user":
      return "User Input Task";
    case "system":
      return "Script Task";
    case "external":
      return "Integration call";
    case "agent":
      return "AI Skill / Connected System";
    default:
      return "Task";
  }
}

// Linear / Jira ticket export. Returns one ticket per acceptance criterion plus
// scaffolding tickets.
export interface IssueTicket {
  title: string;
  body: string;
  labels: string[];
}

export function toLinearTickets(spec: Spec): IssueTicket[] {
  const tickets: IssueTicket[] = [];
  const slug = spec.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  tickets.push({
    title: `[${slug}] Set up project scaffolding`,
    body: `**Goal:** ${spec.goal}\n\nStand up the base project for ${spec.targetPlatform}. Wire DB, deploy target, env vars.\n\nNon-functional notes:\n${spec.nonFunctional.map((n) => `- ${n}`).join("\n") || "- (none specified)"}`,
    labels: ["spec-forge", spec.targetPlatform, "scaffolding"],
  });

  for (const e of spec.dataModel) {
    tickets.push({
      title: `[${slug}] Data model: ${e.entity}`,
      body:
        `**Entity:** ${e.entity}\n\n${e.description}\n\nFields:\n` +
        e.fields
          .map(
            (f) =>
              `- \`${f.name}\` ${f.type}${f.required ? " (required)" : ""}${f.notes ? ` - ${f.notes}` : ""}`,
          )
          .join("\n"),
      labels: ["spec-forge", "data-model"],
    });
  }

  for (const c of spec.components) {
    tickets.push({
      title: `[${slug}] Build component: ${c.name}`,
      body:
        `**Kind:** ${c.kind}\n\n${c.purpose}\n\n${c.fields && c.fields.length ? `Fields: ${c.fields.join(", ")}\n\n` : ""}${c.actions && c.actions.length ? `Actions: ${c.actions.join(", ")}\n` : ""}`,
      labels: ["spec-forge", "component", c.kind],
    });
  }

  for (const sc of spec.successCriteria) {
    tickets.push({
      title: `[${slug}] Acceptance: ${sc.id}`,
      body: `Given ${sc.given}\n\nWhen ${sc.when}\n\nThen ${sc.then}`,
      labels: ["spec-forge", "acceptance"],
    });
  }

  if (spec.openQuestions.length > 0) {
    tickets.push({
      title: `[${slug}] Resolve open questions before build`,
      body: spec.openQuestions
        .map((q, i) => `${i + 1}. **${q.question}** - ${q.why}`)
        .join("\n"),
      labels: ["spec-forge", "blocker"],
    });
  }

  return tickets;
}

export function toLinearMarkdown(spec: Spec): string {
  const tickets = toLinearTickets(spec);
  const lines: string[] = [];
  lines.push(`# ${spec.title} - Ticket plan`);
  lines.push("");
  lines.push(`${tickets.length} tickets generated. Paste into Linear, Jira, or GitHub Issues.`);
  lines.push("");
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    lines.push(`---`);
    lines.push("");
    lines.push(`## ${i + 1}. ${t.title}`);
    lines.push("");
    lines.push(`**Labels:** ${t.labels.join(", ")}`);
    lines.push("");
    lines.push(t.body);
    lines.push("");
  }
  return lines.join("\n");
}

// Plain JSON export so users can pipe into anything.
export function toJson(spec: Spec): string {
  return JSON.stringify(spec, null, 2);
}
