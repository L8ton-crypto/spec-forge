import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ensureDb, getDb } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { getAnthropic, SPEC_TOOL, SYSTEM_PROMPT } from "@/lib/anthropic";
import type { Spec, TargetPlatform } from "@/lib/spec-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_LEN = 8_000;
const MAX_LABEL_LEN = 80;
const MAX_IMAGE_BYTES = 4_500_000; // 4.5MB - keep below Vercel function payload
const ALLOWED_IMAGE = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const VALID_PLATFORMS: TargetPlatform[] = ["web", "appian", "mobile", "internal-tool"];

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | {
      type: "image";
      source:
        | { type: "base64"; media_type: string; data: string }
        | { type: "url"; url: string };
    }
  | { type: string; [key: string]: unknown };

function clientKey(req: NextRequest): string {
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "anon";
}

function sanitiseString(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, max);
}

function inputExcerpt(text: string): string {
  return text.slice(0, 280);
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit("spec:" + clientKey(req), 8, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit reached. Try again in a bit." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rl.resetAt),
          },
        },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const description = sanitiseString((body as { description?: unknown }).description, MAX_TEXT_LEN);
    const platformRaw = sanitiseString((body as { platform?: unknown }).platform, 32) || "web";
    const platform: TargetPlatform = (VALID_PLATFORMS as string[]).includes(platformRaw)
      ? (platformRaw as TargetPlatform)
      : "web";
    const imageDataUrl = sanitiseString((body as { image?: unknown }).image, 8_000_000);

    if (!description && !imageDataUrl) {
      return NextResponse.json(
        { error: "Provide a description or an image to generate a spec." },
        { status: 400 },
      );
    }
    if (description && description.length < 20 && !imageDataUrl) {
      return NextResponse.json(
        { error: "Description is too short. At least 20 characters." },
        { status: 400 },
      );
    }

    let imageBlock: AnthropicContentBlock | null = null;
    let inputType = "text";
    if (imageDataUrl) {
      const m = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) {
        return NextResponse.json(
          { error: "Image must be a base64 data URL." },
          { status: 400 },
        );
      }
      const mediaType = m[1].toLowerCase();
      const base64 = m[2];
      if (!ALLOWED_IMAGE.includes(mediaType)) {
        return NextResponse.json(
          { error: "Image must be PNG, JPEG, WebP, or GIF." },
          { status: 400 },
        );
      }
      // Rough byte estimate from base64 length
      const approxBytes = Math.floor((base64.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Image is too large. Keep under 4MB." },
          { status: 400 },
        );
      }
      imageBlock = {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64,
        },
      };
      inputType = description ? "text+image" : "image";
    }

    const userBlocks: AnthropicContentBlock[] = [];
    if (imageBlock) userBlocks.push(imageBlock);
    const promptText =
      `Target platform: ${platform}\n\n` +
      (description
        ? `Description:\n${description}`
        : "No text description provided. Use the image alone.");
    userBlocks.push({ type: "text", text: promptText });

    const anthropic = getAnthropic();
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [SPEC_TOOL],
      tool_choice: { type: "tool", name: SPEC_TOOL.name },
      messages: [
        {
          role: "user",
          content: userBlocks as unknown as Parameters<
            typeof anthropic.messages.create
          >[0]["messages"][number]["content"],
        },
      ],
    });

    const toolUse = (completion.content as AnthropicContentBlock[]).find(
      (b) => b.type === "tool_use",
    );
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Model did not return a structured spec. Try simplifying the input." },
        { status: 502 },
      );
    }
    const spec = toolUse.input as Spec;
    // Belt and braces: ensure platform is set.
    spec.targetPlatform = platform;

    const id = randomUUID();
    const sourceLabel = description
      ? inputExcerpt(description)
      : "image-only input";

    await ensureDb();
    const db = getDb();
    await db`
      INSERT INTO sf_specs (id, title, summary, input_type, input_excerpt, target_platform, spec)
      VALUES (
        ${id},
        ${spec.title},
        ${spec.summary},
        ${inputType},
        ${sourceLabel},
        ${platform},
        ${JSON.stringify(spec)}
      )
    `;

    return NextResponse.json({ id, spec });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("/api/spec failed:", message);
    return NextResponse.json(
      { error: "Spec generation failed. Try again or simplify the input." },
      { status: 500 },
    );
  }
}
