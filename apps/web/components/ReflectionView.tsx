import type { Reflection } from "@elevantly/core";
import { Sources } from "./Sources";

/**
 * Presentation av Spegelns svar. Ren och tillståndslös — all logik och
 * förankringsvalidering har redan skett i @elevantly/core.
 *
 * Ärlighet är designkravet här: beslut vilar på användarens egna ord, medan
 * styrkor och riktningar är AI-tolkningar och får aldrig se ut som fakta.
 */
export function ReflectionView({ reflection }: { reflection: Reflection }) {
  const { decisions, strengths, roles, followUpQuestion } = reflection;
  const isEmpty =
    decisions.length === 0 && strengths.length === 0 && roles.length === 0;

  return (
    <div className="mt-10 flex flex-col gap-10">
      {isEmpty ? (
        <p className="text-[var(--color-muted)]">
          Jag kunde inte dra några säkra slutsatser av det ännu. Ge mig ett
          konkret exempel på något du gjorde och vad som hände.
        </p>
      ) : (
        <>
          {decisions.length > 0 && (
            <Section title="Handlingar jag identifierade i din text">
              <ul className="flex flex-col gap-6">
                {decisions.map((decision, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-[var(--color-line)] bg-white/50 p-5"
                  >
                    <p className="text-lg leading-snug">{decision.action}</p>
                    {decision.outcome && (
                      <p className="mt-1 text-[var(--color-ink)]">
                        <span className="text-[var(--color-muted)]">
                          Utfall:{" "}
                        </span>
                        {decision.outcome}
                      </p>
                    )}
                    {decision.context && (
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {decision.context}
                      </p>
                    )}
                    {decision.capabilities.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-[var(--color-muted)]">
                          Kompetenser detta kan peka på:
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {decision.capabilities.map((cap, j) => (
                            <li
                              key={j}
                              className="rounded-full border border-[var(--color-line)] px-3 py-1 text-sm text-[var(--color-muted)]"
                            >
                              {cap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Sources kind={decision.kind} sources={decision.sources} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {strengths.length > 0 && (
            <Section title="Vad det kan säga om vad du är bra på">
              <ul className="flex flex-col gap-6">
                {strengths.map((claim, i) => (
                  <li key={i}>
                    <p className="text-lg leading-snug">{claim.statement}</p>
                    <Sources kind={claim.kind} sources={claim.sources} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {roles.length > 0 && (
            <Section title="Möjliga riktningar">
              <ul className="flex flex-col gap-6">
                {roles.map((role, i) => (
                  <li key={i}>
                    <p className="text-lg leading-snug">
                      <span className="text-[var(--color-muted)]">
                        Möjlig riktning:{" "}
                      </span>
                      <span className="font-medium">{role.role}</span>
                    </p>
                    {role.rationale && (
                      <p className="mt-1 text-[var(--color-muted)]">
                        {role.rationale}
                      </p>
                    )}
                    <Sources kind={role.kind} sources={role.sources} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      {/* En enda uppföljningsfråga — copilot-känsla, början på en dialog. */}
      <div className="border-t border-[var(--color-line)] pt-6">
        <p className="text-lg leading-snug">{followUpQuestion}</p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
