"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Ett kanoniskt begrepp för väljaren (från taxonomin). */
export interface SkillOption {
  id: string;
  label: string;
}

const RESPONSIBILITIES: { value: string; label: string }[] = [
  { value: "contributed", label: "Bidrar" },
  { value: "led", label: "Leder" },
  { value: "owned", label: "Äger" },
  { value: "participated", label: "Deltar" },
  { value: "unknown", label: "Ej angivet" },
];

/**
 * Posta ett jobb — strukturerat. Kraven väljs ur den kanoniska taxonomin (kryssrutor),
 * aldrig som fritext: så förblir matchningen på begrepp (anti-djungeln, CLAUDE.md 7.3).
 * Publicera direkt eller spara som utkast.
 */
export function JobPostForm({
  companyId,
  skills,
}: {
  companyId: string;
  skills: SkillOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [responsibility, setResponsibility] = useState("contributed");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [required, setRequired] = useState<Set<string>>(new Set());
  const [preferred, setPreferred] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = title.trim().length > 0 && required.size > 0 && !busy;

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  }

  async function submit(publish: boolean) {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          title: title.trim(),
          summary: summary.trim(),
          responsibility,
          location: location.trim(),
          remote,
          requiredSkillIds: [...required],
          // Ett begrepp räknas som meriterande bara om det inte redan är obligatoriskt.
          preferredSkillIds: [...preferred].filter((id) => !required.has(id)),
          publish,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kunde inte spara jobbet.");
        return;
      }
      router.refresh();
      setTitle("");
      setSummary("");
      setLocation("");
      setRemote(false);
      setRequired(new Set());
      setPreferred(new Set());
    } catch {
      setError("Kunde inte spara just nu. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--color-line)] bg-white p-3 text-base outline-none transition focus:border-[var(--color-ink)]";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(true);
      }}
      className="flex flex-col gap-5 rounded-2xl border border-[var(--color-line)] bg-white/50 p-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="job-title" className="text-sm font-medium">
          Jobbtitel
        </label>
        <input
          id="job-title"
          type="text"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="T.ex. Frontendutvecklare"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="job-summary" className="text-sm font-medium">
          Beskrivning{" "}
          <span className="font-normal text-[var(--color-muted)]">(fritext, valfri)</span>
        </label>
        <textarea
          id="job-summary"
          value={summary}
          rows={3}
          maxLength={2000}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Vad innebär rollen?"
          className={`${inputClass} resize-y`}
        />
      </div>

      <SkillPicker
        legend="Obligatoriska krav"
        hint="Minst ett. Väljs ur den kanoniska taxonomin — inte fritext."
        skills={skills}
        selected={required}
        onToggle={(id) => toggle(required, setRequired, id)}
      />
      <SkillPicker
        legend="Meriterande"
        hint="Valfritt."
        skills={skills}
        selected={preferred}
        onToggle={(id) => toggle(preferred, setPreferred, id)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="job-responsibility" className="text-sm font-medium">
            Ansvarsnivå
          </label>
          <select
            id="job-responsibility"
            value={responsibility}
            onChange={(e) => setResponsibility(e.target.value)}
            className={inputClass}
          >
            {RESPONSIBILITIES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="job-location" className="text-sm font-medium">
            Plats <span className="font-normal text-[var(--color-muted)]">(valfri)</span>
          </label>
          <input
            id="job-location"
            type="text"
            value={location}
            maxLength={80}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="T.ex. Stockholm"
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={remote}
          onChange={(e) => setRemote(e.target.checked)}
        />
        Distans möjligt
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Sparar …" : "Publicera jobb"}
        </button>
        <button
          type="button"
          onClick={() => void submit(false)}
          disabled={!canSubmit}
          className="rounded-full border border-[var(--color-line)] px-6 py-3 font-medium transition hover:border-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Spara utkast
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--color-ink)]">
          {error}
        </p>
      )}
    </form>
  );
}

function SkillPicker({
  legend,
  hint,
  skills,
  selected,
  onToggle,
}: {
  legend: string;
  hint: string;
  skills: SkillOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <p className="text-sm text-[var(--color-muted)]">{hint}</p>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => {
          const on = selected.has(skill.id);
          return (
            <label
              key={skill.id}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                on
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-line)] bg-white hover:border-[var(--color-ink)]"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(skill.id)}
                className="sr-only"
              />
              {skill.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
