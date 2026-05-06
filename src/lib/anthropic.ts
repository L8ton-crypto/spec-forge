import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Tool schema describing the canonical Spec shape. Used with tool_choice
// to force Claude into structured output.
export const SPEC_TOOL = {
  name: "emit_spec",
  description:
    "Emit a structured product spec in the canonical SpecForge shape. Always call this exactly once with a complete spec.",
  input_schema: {
    type: "object" as const,
    required: [
      "title",
      "summary",
      "targetPlatform",
      "primaryUser",
      "goal",
      "components",
      "dataModel",
      "processFlow",
      "successCriteria",
      "nonFunctional",
      "openQuestions",
      "riskFlags",
    ],
    properties: {
      title: { type: "string", description: "Short title, 3 to 8 words" },
      summary: {
        type: "string",
        description: "One paragraph summary, plain English, no jargon",
      },
      targetPlatform: {
        type: "string",
        enum: ["web", "appian", "mobile", "internal-tool"],
      },
      primaryUser: { type: "string", description: "Who uses this and why" },
      goal: {
        type: "string",
        description: "The single outcome that proves the build worked",
      },
      components: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "kind", "purpose"],
          properties: {
            name: { type: "string" },
            kind: {
              type: "string",
              enum: [
                "page",
                "form",
                "list",
                "modal",
                "card",
                "navigation",
                "report",
                "other",
              ],
            },
            purpose: { type: "string" },
            fields: { type: "array", items: { type: "string" } },
            actions: { type: "array", items: { type: "string" } },
          },
        },
      },
      dataModel: {
        type: "array",
        items: {
          type: "object",
          required: ["entity", "description", "fields"],
          properties: {
            entity: { type: "string" },
            description: { type: "string" },
            fields: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "type", "required"],
                properties: {
                  name: { type: "string" },
                  type: {
                    type: "string",
                    enum: [
                      "text",
                      "number",
                      "date",
                      "datetime",
                      "boolean",
                      "enum",
                      "reference",
                      "json",
                    ],
                  },
                  required: { type: "boolean" },
                  notes: { type: "string" },
                },
              },
            },
            relations: { type: "array", items: { type: "string" } },
          },
        },
      },
      processFlow: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "actor", "action"],
          properties: {
            id: { type: "string" },
            actor: {
              type: "string",
              enum: ["user", "system", "external", "agent"],
            },
            action: { type: "string" },
            inputs: { type: "array", items: { type: "string" } },
            outputs: { type: "array", items: { type: "string" } },
            decisions: { type: "array", items: { type: "string" } },
          },
        },
      },
      successCriteria: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "given", "when", "then"],
          properties: {
            id: { type: "string" },
            given: { type: "string" },
            when: { type: "string" },
            then: { type: "string" },
          },
        },
      },
      nonFunctional: {
        type: "array",
        items: { type: "string" },
        description: "Performance, security, accessibility, scale notes",
      },
      openQuestions: {
        type: "array",
        items: {
          type: "object",
          required: ["question", "why"],
          properties: {
            question: { type: "string" },
            why: { type: "string" },
          },
        },
      },
      riskFlags: {
        type: "array",
        items: { type: "string" },
        description: "Known traps, scope creep, integration risks",
      },
    },
  },
};

export const SYSTEM_PROMPT = `You are SpecForge, a senior product architect. You turn rough ideas, screenshots, and natural language descriptions into structured specs that AI dev agents (Cursor, Claude Code, an Appian dev agent) can execute against.

Rules:
- Be concrete. No filler. No "the system shall" boilerplate.
- Components must be buildable. If the user says "dashboard" you decide which charts and lists, name them.
- Data fields are the real columns the user needs. Skip generic id/created_at unless they matter.
- Process flow is the actual sequence: user lands here, clicks this, system does that, sends here.
- Success criteria are testable Given/When/Then statements. No vague "user is satisfied" stuff.
- Surface open questions only when something is genuinely ambiguous. Do not invent gaps.
- Risk flags name the things that bite: scope creep, missing data sources, auth, third-party rate limits, accessibility, mobile constraints.
- If the targetPlatform is appian, components map to records, SAIL forms, process models. Data model maps to record types. Process flow maps to process model nodes.
- Always call emit_spec exactly once. Do not chat. Do not ask follow-up questions. Make reasonable assumptions and note them in openQuestions.`;
