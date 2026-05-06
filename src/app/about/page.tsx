import Link from "next/link";

export const metadata = {
  title: "About SpecForge",
};

export default function About() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <header className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            SF
          </div>
          <div className="text-lg font-bold tracking-tight">SpecForge</div>
        </Link>
        <Link href="/" className="tab">Back to app</Link>
      </header>

      <article className="prose prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-4">Why this exists</h1>

        <p className="text-gray-300 mb-4">
          AI dev agents (Cursor, Claude Code, the new Appian dev agent) only build well
          if you hand them a tight spec. Most teams cannot write one. They pile loose
          ideas into a Confluence page, the agent guesses, the build drifts, the team
          writes off agent coding as hype.
        </p>

        <p className="text-gray-300 mb-4">
          Spec-writing is the new core skill. It is not the same as writing user stories
          or BRDs. It is component-level, data-model-aware, with testable Given/When/Then
          criteria. SpecForge does the translation for you. Paste a screenshot, describe
          a process, sketch a flow - get back a spec the agent can execute.
        </p>

        <h2 className="text-xl font-bold mb-3 mt-8">What it does</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-1 mb-6">
          <li>Extracts UI components, data model, and process flow from rough input.</li>
          <li>Writes acceptance criteria as Given/When/Then.</li>
          <li>Surfaces risks and open questions explicitly, not buried in prose.</li>
          <li>Exports to Cursor / Claude Code task list, Appian build plan, or Linear/Jira tickets.</li>
        </ul>

        <h2 className="text-xl font-bold mb-3 mt-8">Stack</h2>
        <p className="text-gray-300 mb-2">
          Next.js, TypeScript, Tailwind, Neon Postgres, Anthropic Claude with structured
          tool use, deployed on Vercel. Dark mode, mobile-first.
        </p>

        <h2 className="text-xl font-bold mb-3 mt-8">Free</h2>
        <p className="text-gray-300 mb-6">
          SpecForge is free. The portfolio is the product. If you want help wiring a
          spec-driven build pipeline into your team, that is what consulting is for.{" "}
          <a href="https://www.linkedin.com/in/leightonrice" className="underline">
            Find me on LinkedIn
          </a>
          .
        </p>

        <p className="text-gray-500 text-xs mt-12">
          Built by Leighton Rice (L8). Part of the Arc Forge portfolio of 40+ apps.
        </p>
      </article>
    </main>
  );
}
