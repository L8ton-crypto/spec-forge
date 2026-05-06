"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { Spec, TargetPlatform } from "@/lib/spec-types";
import { PLATFORMS } from "@/lib/spec-types";
import SpecView from "@/components/SpecView";

const EXAMPLES = [
  {
    label: "Internal expense tool",
    text: "Build a small internal tool for staff to log expenses with a receipt photo. Manager approves or rejects. Approved expenses go to a monthly export. Categories are travel, meals, software, other.",
  },
  {
    label: "Customer onboarding",
    text: "We onboard new B2B customers. Sales hands off, ops collects company info, billing sets up the contract, IT provisions accounts. Today this lives in 4 spreadsheets and a Slack channel. Make it one tool.",
  },
  {
    label: "Appian: claim intake",
    text: "Insurance claim intake. Customer submits a form with policy number, incident date, photos, description. System checks policy is active, routes high-value claims to senior assessor, low-value to junior. SLA: first response in 4 working hours.",
  },
];

export default function Home() {
  const [tab, setTab] = useState<"text" | "image">("text");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<TargetPlatform>("web");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [specId, setSpecId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Image too large. Keep under 4MB.");
      return;
    }
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setError("PNG, JPEG, WebP, or GIF only.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setImageName(file.name);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const onSubmit = useCallback(async () => {
    setError(null);
    if (!description.trim() && !imageDataUrl) {
      setError("Add a description or attach an image.");
      return;
    }
    setLoading(true);
    setSpec(null);
    setSpecId(null);
    try {
      const res = await fetch("/api/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          platform,
          image: imageDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate spec.");
      }
      setSpec(data.spec as Spec);
      setSpecId(data.id as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate spec.");
    } finally {
      setLoading(false);
    }
  }, [description, platform, imageDataUrl]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            SF
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">SpecForge</div>
            <div className="text-xs text-gray-500 -mt-0.5">Specs your AI agent can execute against</div>
          </div>
        </div>
        <nav className="flex gap-2">
          <Link href="/about" className="tab">About</Link>
          <a
            href="https://github.com/L8ton-crypto/spec-forge"
            target="_blank"
            rel="noreferrer"
            className="tab"
          >
            GitHub
          </a>
        </nav>
      </header>

      <section className="mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
          Spec-writing is the new <span className="gradient-text">core skill</span>.
        </h1>
        <p className="text-base sm:text-lg text-gray-400 max-w-3xl">
          Paste a screenshot, describe a process in plain English, or sketch a flow.
          Get back a structured spec - components, data model, process flow, success criteria -
          in the format Cursor, Claude Code, or an Appian dev agent can actually execute.
        </p>
      </section>

      <section className="panel p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          <button
            className={`tab ${tab === "text" ? "active" : ""}`}
            onClick={() => setTab("text")}
            type="button"
          >
            Describe in text
          </button>
          <button
            className={`tab ${tab === "image" ? "active" : ""}`}
            onClick={() => setTab("image")}
            type="button"
          >
            Upload screenshot or sketch
          </button>
        </div>

        {tab === "text" ? (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
              Describe what you want built
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="A small tool for our team to log expenses with a receipt photo, manager approves or rejects, monthly export to CSV..."
              maxLength={8000}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {EXAMPLES.map((e) => (
                <button
                  key={e.label}
                  className="tab"
                  type="button"
                  onClick={() => setDescription(e.text)}
                >
                  Try: {e.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
              Upload a screenshot, mockup, or hand-drawn sketch
            </label>
            <div
              className="panel-2 p-6 text-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {imageDataUrl ? (
                <div>
                  <picture>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageDataUrl}
                      alt="preview"
                      style={{ maxHeight: 280, margin: "0 auto", borderRadius: 8 }}
                    />
                  </picture>
                  <div className="text-sm text-gray-400 mt-2">{imageName}</div>
                  <button
                    type="button"
                    className="tab mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageDataUrl(null);
                      setImageName(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-gray-400 mb-1">Click to choose, or drag a file here</div>
                  <div className="text-xs text-gray-600">
                    PNG, JPEG, WebP, or GIF. Max 4MB.
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                Optional: extra context
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Any extra context the screenshot does not cover..."
                maxLength={8000}
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
              Target platform
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`tab ${platform === p.value ? "active" : ""}`}
                  onClick={() => setPlatform(p.value)}
                  title={p.hint}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Generating spec..." : "Generate spec"}
          </button>
        </div>

        {error && (
          <div className="mt-4 text-sm" style={{ color: "var(--danger)" }}>
            {error}
          </div>
        )}
      </section>

      {loading && <LoadingSkeleton />}

      {spec && specId && <SpecView spec={spec} id={specId} />}

      <footer className="mt-16 text-xs text-gray-600 text-center">
        SpecForge - free for everyone. Built by{" "}
        <a
          href="https://www.linkedin.com/in/leightonrice"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Leighton Rice
        </a>
        . Part of the Arc Forge portfolio.
      </footer>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div className="panel p-6 mb-6 animate-pulse-soft">
      <div className="skeleton h-6 w-48 mb-4" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-5/6 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
    </div>
  );
}
