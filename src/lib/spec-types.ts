// Canonical spec shape returned to clients and stored in DB.
// Designed to be platform-neutral so the same spec can export to Cursor,
// Claude Code, Appian flow, or Linear/Jira tickets.

export type TargetPlatform = "web" | "appian" | "mobile" | "internal-tool";

export interface SpecComponent {
  name: string;
  kind: "page" | "form" | "list" | "modal" | "card" | "navigation" | "report" | "other";
  purpose: string;
  fields?: string[];
  actions?: string[];
}

export interface SpecDataField {
  name: string;
  type: "text" | "number" | "date" | "datetime" | "boolean" | "enum" | "reference" | "json";
  required: boolean;
  notes?: string;
}

export interface SpecDataModel {
  entity: string;
  description: string;
  fields: SpecDataField[];
  relations?: string[];
}

export interface SpecProcessStep {
  id: string;
  actor: "user" | "system" | "external" | "agent";
  action: string;
  inputs?: string[];
  outputs?: string[];
  decisions?: string[];
}

export interface SpecSuccessCriterion {
  id: string;
  given: string;
  when: string;
  then: string;
}

export interface SpecOpenQuestion {
  question: string;
  why: string;
}

export interface Spec {
  title: string;
  summary: string;
  targetPlatform: TargetPlatform;
  primaryUser: string;
  goal: string;
  components: SpecComponent[];
  dataModel: SpecDataModel[];
  processFlow: SpecProcessStep[];
  successCriteria: SpecSuccessCriterion[];
  nonFunctional: string[];
  openQuestions: SpecOpenQuestion[];
  riskFlags: string[];
}

export const PLATFORMS: { value: TargetPlatform; label: string; hint: string }[] = [
  { value: "web", label: "Web app", hint: "Next.js, React, Tailwind, Postgres" },
  { value: "appian", label: "Appian", hint: "Records, SAIL forms, process model, decisions" },
  { value: "mobile", label: "Mobile app", hint: "React Native or native iOS/Android" },
  { value: "internal-tool", label: "Internal tool", hint: "Retool, Streamlit, simple CRUD" },
];
