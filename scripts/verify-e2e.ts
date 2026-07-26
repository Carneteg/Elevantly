/**
 * End-to-end-verifiering av Spegeln mot en SKARP Claude-motor.
 *
 * Detta är en manuell/lokal rutin — den kör riktiga API-anrop och kostar pengar.
 * Den körs INTE i CI (CI har ingen nyckel och ska inte kosta). Syftet är att
 * bekräfta att hela `runReflection`-flödet fungerar mot en riktig modell och att
 * grundnings-/ärlighetsinvarianterna håller på skarpa svar — inte bara att det
 * "inte kraschade".
 *
 * Nyckeln läses ALLTID från process.env.ANTHROPIC_API_KEY. Ingen nyckel ligger
 * i kod, prompt, tester eller repo.
 *
 * Kör:  ANTHROPIC_API_KEY=sk-... npm run verify:e2e
 */
import { createEngine, isGrounded, runReflection } from "@elevantly/core";
import type {
  AIProvider,
  CapabilityClaim,
  Reflection,
  ResolvedEngine,
  ResponsibilityLevel,
} from "@elevantly/core";

/** Tolkar AI_PROVIDER; okänt/tomt värde → undefined (låt nyckeln avgöra). */
function normalizeProvider(value: string | undefined): AIProvider | undefined {
  return value === "openai" || value === "claude" ? value : undefined;
}

if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  console.error(
    [
      "✖ Ingen AI-nyckel i miljön.",
      "",
      "  Sätt en av dessa och kör igen:",
      "      export OPENAI_API_KEY=sk-...      # eller",
      "      export ANTHROPIC_API_KEY=sk-...",
      "      npm run verify:e2e",
      "",
      "  Nyckeln läses bara från miljön och lagras aldrig i repot.",
    ].join("\n"),
  );
  process.exit(1);
}

let resolved: ResolvedEngine;
try {
  resolved = createEngine({
    provider: normalizeProvider(process.env.AI_PROVIDER),
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || undefined,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || undefined,
  });
} catch (error) {
  console.error(`✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

/** Ansvarsnivåer rangordnade; "unknown" = inget stöd (lägst). */
const RESPONSIBILITY_RANK: Record<ResponsibilityLevel, number> = {
  unknown: -1,
  participated: 0,
  contributed: 1,
  led: 2,
  owned: 3,
};

interface Example {
  id: string;
  text: string;
  /** Högsta ansvarsnivå texten rimligen stödjer. Överskrids den → fel. */
  maxResponsibility: ResponsibilityLevel;
  /** Kräv minst en förankrad post (tydliga texter ska ge något). */
  expectContent: boolean;
}

const EXAMPLES: Example[] = [
  {
    id: "tydligt ledarskap",
    text:
      "Förra året ledde jag ett team på sex personer genom en omorganisation. " +
      "Jag ansvarade för hela projektet och vi minskade ledtiden med 30 procent.",
    maxResponsibility: "owned",
    expectContent: true,
  },
  {
    id: "endast deltagande",
    text:
      "Jag deltog i ett projekt där vi bytte vårt CRM-system. Jag var med på " +
      "planeringsmötena och testade den nya lösningen innan lansering.",
    maxResponsibility: "contributed",
    expectContent: false,
  },
  {
    id: "tvetydig",
    text:
      "Jag jobbade med vår nya prissättningsmodell under det senaste kvartalet.",
    // Ingen tydlig ägarskapssignal → ska bli "unknown" eller lägsta nivå.
    maxResponsibility: "participated",
    expectContent: false,
  },
];

/** En förankrad källa kan vara trunkerad (…) för visning; jämför mot fulltext. */
function sourceIsGrounded(source: string, originalText: string): boolean {
  if (isGrounded(source, originalText)) return true;
  if (source.endsWith("…")) {
    return isGrounded(source.slice(0, -1), originalText);
  }
  return false;
}

/** Samlar (etikett, kind, sources) för varje visad post i en reflection. */
function displayedItems(
  reflection: Reflection,
): Array<{ label: string; kind: string; sources: string[] }> {
  const items: Array<{ label: string; kind: string; sources: string[] }> = [];
  for (const decision of reflection.decisions) {
    items.push({
      label: `decision: ${decision.action}`,
      kind: decision.kind,
      sources: decision.sources,
    });
    for (const cap of decision.capabilities) {
      items.push({
        label: `capability: ${cap.name}`,
        kind: cap.kind,
        sources: cap.sources,
      });
    }
  }
  for (const strength of reflection.strengths) {
    items.push({
      label: `strength: ${strength.statement}`,
      kind: strength.kind,
      sources: strength.sources,
    });
  }
  for (const role of reflection.roles) {
    items.push({
      label: `role: ${role.role}`,
      kind: role.kind,
      sources: role.sources,
    });
  }
  return items;
}

function formatCapability(cap: CapabilityClaim): string {
  return `${cap.name} (${cap.confidence}, kind=${cap.kind})`;
}

function printReflection(reflection: Reflection): void {
  const { decisions, strengths, roles, followUpQuestion } = reflection;

  console.log(`  decisions (${decisions.length}):`);
  for (const d of decisions) {
    console.log(`    • ${d.action}`);
    console.log(`      responsibility: ${d.responsibility} | kind: ${d.kind}`);
    if (d.outcome) console.log(`      utfall: ${d.outcome}`);
    if (d.capabilities.length > 0) {
      console.log(
        `      kompetenser: ${d.capabilities.map(formatCapability).join(", ")}`,
      );
    }
    console.log(`      källor: ${d.sources.map((s) => `"${s}"`).join(" | ")}`);
  }

  console.log(`  strengths (${strengths.length}):`);
  for (const s of strengths) {
    console.log(`    • ${s.statement}  [kind=${s.kind}]`);
    console.log(`      källor: ${s.sources.map((x) => `"${x}"`).join(" | ")}`);
  }

  console.log(`  roles (${roles.length}):`);
  for (const r of roles) {
    console.log(`    • ${r.role}  [kind=${r.kind}]`);
    console.log(`      källor: ${r.sources.map((x) => `"${x}"`).join(" | ")}`);
  }

  console.log(`  uppföljningsfråga: ${followUpQuestion}`);
}

/** Kontrollerar invarianterna. Returnerar en lista med brutna invarianter. */
function checkInvariants(example: Example, reflection: Reflection): string[] {
  const failures: string[] = [];
  const items = displayedItems(reflection);

  // 1. Varje visad post har minst ett ordagrant förankrat citat.
  for (const item of items) {
    const grounded = item.sources.some((s) =>
      sourceIsGrounded(s, example.text),
    );
    if (!grounded) {
      failures.push(
        `[${example.id}] posten "${item.label}" saknar förankrat citat i originaltexten (källor: ${JSON.stringify(item.sources)})`,
      );
    }
  }

  // 2. Ingen post får ha kind "verified".
  for (const item of items) {
    if (item.kind === "verified") {
      failures.push(
        `[${example.id}] posten "${item.label}" har kind: "verified" (otillåtet)`,
      );
    }
  }

  // 3. Responsibility får aldrig överstiga vad texten stödjer.
  const cap = RESPONSIBILITY_RANK[example.maxResponsibility];
  for (const decision of reflection.decisions) {
    if (RESPONSIBILITY_RANK[decision.responsibility] > cap) {
      failures.push(
        `[${example.id}] responsibility "${decision.responsibility}" överstiger tillåtet max "${example.maxResponsibility}" för handlingen "${decision.action}"`,
      );
    }
  }

  // 4. Tydliga texter ska ge minst en förankrad post.
  if (example.expectContent && items.length === 0) {
    failures.push(
      `[${example.id}] förväntade minst en förankrad post men fick inga (modellen kanske parafraserade i stället för att citera)`,
    );
  }

  return failures;
}

async function main(): Promise<void> {
  console.log("Spegeln — end-to-end-verifiering mot skarp AI-motor");
  console.log(`Motor: ${resolved.provider} | modell: ${resolved.model}`);
  console.log("(riktiga API-anrop — detta kostar pengar)\n");

  const engine = resolved.engine;
  const allFailures: string[] = [];

  for (const example of EXAMPLES) {
    console.log("─".repeat(72));
    console.log(`Exempel: ${example.id}`);
    console.log(`Text: ${example.text}\n`);

    let reflection: Reflection;
    try {
      reflection = await runReflection(engine, example.text);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      allFailures.push(`[${example.id}] motoranrop misslyckades: ${message}`);
      console.error(`  ✖ motoranrop misslyckades: ${message}\n`);
      continue;
    }

    printReflection(reflection);

    const failures = checkInvariants(example, reflection);
    if (failures.length === 0) {
      console.log("\n  ✓ invarianter OK\n");
    } else {
      for (const failure of failures) console.log(`\n  ✖ ${failure}`);
      console.log("");
    }
    allFailures.push(...failures);
  }

  console.log("═".repeat(72));
  if (allFailures.length === 0) {
    console.log("✓ Alla invarianter höll mot den skarpa modellen.");
    process.exit(0);
  }

  console.log(`✖ ${allFailures.length} brutna invariant(er):`);
  for (const failure of allFailures) console.log(`  - ${failure}`);
  process.exit(1);
}

void main();
