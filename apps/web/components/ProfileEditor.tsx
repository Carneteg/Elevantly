"use client";

import { useState } from "react";
import type { ProfileVisibility } from "@elevantly/core";

type Status = "idle" | "saving" | "saved" | "error";

interface ProfileEditorProps {
  initialHandle: string;
  initialDisplayName: string;
  initialHeadline: string;
  initialVisibility: ProfileVisibility;
  initialDiscoverable: boolean;
}

/**
 * Redigering av den delbara profilen: användarnamn, visningsnamn, kort headline
 * och synlighet. Default är privat — att bli offentlig är ett uttryckligt val
 * (CLAUDE.md 9.3). Låg friktion, tydliga fel, synlig sparbekräftelse.
 */
export function ProfileEditor({
  initialHandle,
  initialDisplayName,
  initialHeadline,
  initialVisibility,
  initialDiscoverable,
}: ProfileEditorProps) {
  const [handle, setHandle] = useState(initialHandle);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [headline, setHeadline] = useState(initialHeadline);
  const [visibility, setVisibility] =
    useState<ProfileVisibility>(initialVisibility);
  const [discoverable, setDiscoverable] = useState(initialDiscoverable);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const isPublic = visibility === "public";
  const isPrivate = visibility === "private";
  // Opt-in för rekryterarsök är bara meningsfullt på en offentlig profil (§9.3);
  // servern upprätthåller samma invariant oavsett vad som skickas.
  const discoverableEffective = isPublic && discoverable;

  const savedMessage: Record<ProfileVisibility, string> = {
    private: "Sparat. Din profil är privat.",
    contacts: "Sparat. Din profil syns för dina kontakter.",
    public: "Sparat. Din profil är offentlig.",
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          displayName,
          headline,
          visibility,
          discoverableByRecruiters: discoverableEffective,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        handle?: string | null;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Kunde inte spara. Försök igen.");
        return;
      }

      setStatus("saved");
      setMessage(savedMessage[visibility]);
    } catch {
      setStatus("error");
      setMessage("Kunde inte spara just nu. Försök igen.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--color-line)] bg-white p-3 text-base outline-none transition focus:border-[var(--color-ink)]";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-[var(--color-line)] bg-white/50 p-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="displayName" className="text-sm font-medium">
          Visningsnamn
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          maxLength={80}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ditt namn"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="headline" className="text-sm font-medium">
          Headline
        </label>
        <input
          id="headline"
          type="text"
          value={headline}
          maxLength={160}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="T.ex. Produktledare"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="handle" className="text-sm font-medium">
          Användarnamn <span className="text-[var(--color-muted)]">(för din länk /u/…)</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-muted)]">/u/</span>
          <input
            id="handle"
            type="text"
            value={handle}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="dittnamn"
            aria-describedby="handle-hint"
            className={inputClass}
          />
        </div>
        <p id="handle-hint" className="text-sm text-[var(--color-muted)]">
          3–30 tecken: a–z, 0–9, _ eller -. Krävs för att dela profilen (kontakter
          eller offentlig).
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Synlighet</legend>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3">
          <input
            type="radio"
            name="visibility"
            value="private"
            checked={isPrivate}
            onChange={() => setVisibility("private")}
          />
          <span>
            <span className="font-medium">Privat</span>
            <span className="block text-sm text-[var(--color-muted)]">
              Bara du ser din profil.
            </span>
          </span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3">
          <input
            type="radio"
            name="visibility"
            value="contacts"
            checked={visibility === "contacts"}
            onChange={() => setVisibility("contacts")}
          />
          <span>
            <span className="font-medium">Kontakter</span>
            <span className="block text-sm text-[var(--color-muted)]">
              Bara dina accepterade kontakter ser namn, headline och dina beslut.
            </span>
          </span>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3">
          <input
            type="radio"
            name="visibility"
            value="public"
            checked={isPublic}
            onChange={() => setVisibility("public")}
          />
          <span>
            <span className="font-medium">Offentlig</span>
            <span className="block text-sm text-[var(--color-muted)]">
              Vem som helst med länken ser namn, headline och dina beslut.
            </span>
          </span>
        </label>

        <label
          className={`ml-6 flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3 ${
            isPublic ? "" : "opacity-50"
          }`}
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={discoverableEffective}
            disabled={!isPublic}
            onChange={(e) => setDiscoverable(e.target.checked)}
          />
          <span>
            <span className="font-medium">Synlig i rekryterarsök</span>
            <span className="block text-sm text-[var(--color-muted)]">
              {isPublic
                ? "Företag kan hitta dig via dina attesterade beslut. Ett eget val — offentlig betyder inte automatiskt sökbar."
                : "Kräver en offentlig profil. Välj Offentlig ovan för att kunna slås på."}
            </span>
          </span>
        </label>
      </fieldset>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "saving" ? "Sparar …" : "Spara profil"}
        </button>
        {!isPrivate && handle && (
          <a
            href={`/u/${handle}`}
            className="text-sm underline"
            target="_blank"
            rel="noreferrer"
          >
            Visa din profilsida ↗
          </a>
        )}
      </div>

      {message && (
        <p
          role={status === "error" ? "alert" : "status"}
          className={
            status === "error"
              ? "text-[var(--color-ink)]"
              : "text-[var(--color-muted)]"
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}
