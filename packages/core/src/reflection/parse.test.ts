import { describe, expect, it } from "vitest";
import { isGrounded, parseReflection, PARSE_LIMITS } from "./parse";
import { runReflection } from "./runReflection";
import type { AIEngine, RawReflection } from "../ai/engine";

/**
 * Kritisk affärslogik (CLAUDE.md 16): struktureringen av fritext till
 * förankrade, ärlighetsmärkta poster. Testerna är deterministiska och kräver
 * ingen riktig AI-motor — de matar in fixtur-JSON precis som en motor skulle
 * svara.
 */

const USER_TEXT =
  "Jag byggde om vårt onboarding-flöde och minskade churn med 12 procent. " +
  "Jag ledde också ett team på fyra personer genom en stökig migrering.";

describe("isGrounded", () => {
  it("godkänner ett ordagrant utdrag ur texten", () => {
    expect(isGrounded("minskade churn med 12 procent", USER_TEXT)).toBe(true);
  });

  it("är okänsligt för skiftläge och extra whitespace", () => {
    expect(isGrounded("  Minskade   Churn  med 12 PROCENT ", USER_TEXT)).toBe(
      true,
    );
  });

  it("underkänner en parafras som inte finns i texten", () => {
    expect(isGrounded("förbättrade kundnöjdheten rejält", USER_TEXT)).toBe(
      false,
    );
  });

  it("underkänner tom källa", () => {
    expect(isGrounded("", USER_TEXT)).toBe(false);
    expect(isGrounded("   ", USER_TEXT)).toBe(false);
  });
});

describe("parseReflection", () => {
  it("strukturerar ett giltigt svar till typade, förankrade poster med rätt kind", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Byggde om onboarding-flödet",
          context: "internt produktarbete",
          outcome: "minskade churn med 12 procent",
          capabilities: ["produktutveckling", "dataanalys"],
          sources: ["minskade churn med 12 procent"],
        },
      ],
      strengths: [
        {
          statement: "Du driver mätbar produktförbättring",
          sources: ["minskade churn med 12 procent"],
        },
      ],
      roles: [
        {
          role: "Product Manager",
          rationale: "Kombinerar produktbeslut med mätbart utfall",
          sources: ["byggde om vårt onboarding-flöde"],
        },
      ],
      followUpQuestion: "Vad var svårast i migreringen?",
    };

    const result = parseReflection(raw, USER_TEXT);

    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]).toEqual({
      action: "Byggde om onboarding-flödet",
      context: "internt produktarbete",
      outcome: "minskade churn med 12 procent",
      capabilities: ["produktutveckling", "dataanalys"],
      sources: ["minskade churn med 12 procent"],
      kind: "quote",
    });

    expect(result.strengths).toHaveLength(1);
    expect(result.strengths[0]?.kind).toBe("interpretation");
    expect(result.strengths[0]?.sources).toEqual([
      "minskade churn med 12 procent",
    ]);

    expect(result.roles).toHaveLength(1);
    expect(result.roles[0]?.kind).toBe("interpretation");

    expect(result.followUpQuestion).toBe("Vad var svårast i migreringen?");
  });

  it("stödjer flera källor och släpper de som inte är förankrade", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Ledde ett team genom en migrering",
          capabilities: ["ledarskap"],
          sources: [
            "ledde också ett team på fyra personer", // förankrad
            "genom en stökig migrering", // förankrad
            "på rekordtid utan buggar", // finns INTE i texten → släpps
          ],
        },
      ],
    };

    const decision = parseReflection(raw, USER_TEXT).decisions[0];
    expect(decision).toBeDefined();
    expect(decision?.sources).toEqual([
      "ledde också ett team på fyra personer",
      "genom en stökig migrering",
    ]);
  });

  it("stödjer bakåtkompatibelt enkelt sourceText-fält", () => {
    const raw: RawReflection = {
      strengths: [
        {
          statement: "Du är bra på ledarskap",
          sourceText: "ledde också ett team på fyra personer",
        },
      ],
    };

    const result = parseReflection(raw, USER_TEXT);
    expect(result.strengths).toHaveLength(1);
    expect(result.strengths[0]?.sources).toEqual([
      "ledde också ett team på fyra personer",
    ]);
    expect(result.strengths[0]?.kind).toBe("interpretation");
  });

  it("filtrerar bort en interpretation vars enda källa inte finns i texten", () => {
    const raw: RawReflection = {
      strengths: [
        {
          statement: "Du är en visionär strateg",
          sources: ["byggde en tioårig strategi"],
        },
      ],
    };

    expect(parseReflection(raw, USER_TEXT).strengths).toHaveLength(0);
  });

  it("filtrerar bort en decision helt utan källor (ingen spårbar grund)", () => {
    const raw: RawReflection = {
      decisions: [
        { action: "Ledde ett team", capabilities: ["ledarskap"], sources: [] },
      ],
    };

    expect(parseReflection(raw, USER_TEXT).decisions).toHaveLength(0);
  });

  it("filtrerar bort en decision utan action", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "",
          capabilities: ["ledarskap"],
          sources: ["ledde också ett team på fyra personer"],
        },
      ],
    };

    expect(parseReflection(raw, USER_TEXT).decisions).toHaveLength(0);
  });

  it("utelämnar valfria fält när de saknas och normaliserar capabilities", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Ledde en migrering",
          capabilities: ["ledarskap", "  ledarskap ", "", "migrering"],
          sources: ["ledde också ett team på fyra personer"],
        },
      ],
    };

    const [decision] = parseReflection(raw, USER_TEXT).decisions;
    expect(decision).toBeDefined();
    expect(decision).not.toHaveProperty("context");
    expect(decision).not.toHaveProperty("outcome");
    // dubbletter (skiftlägesokänsligt) och tomma strängar bort
    expect(decision?.capabilities).toEqual(["ledarskap", "migrering"]);
  });

  it("kräver förankrad källa även för roller", () => {
    const raw: RawReflection = {
      roles: [
        {
          role: "CTO",
          rationale: "byggde hela plattformen",
          sources: ["byggde hela plattformen själv på en helg"],
        },
      ],
    };

    expect(parseReflection(raw, USER_TEXT).roles).toHaveLength(0);
  });

  it("låter aldrig motorn hitta på ett kind — det sätts deterministiskt", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Ledde en migrering",
          capabilities: [],
          sources: ["ledde också ett team på fyra personer"],
          kind: "verified", // motorns försök att flagga som verifierat ignoreras
        },
      ],
      strengths: [
        {
          statement: "Du är bra på ledarskap",
          sources: ["ledde också ett team på fyra personer"],
          kind: "verified",
        },
      ],
    };

    const result = parseReflection(raw, USER_TEXT);
    expect(result.decisions[0]?.kind).toBe("quote");
    expect(result.strengths[0]?.kind).toBe("interpretation");
  });

  it("ger en default-uppföljningsfråga när motorn inte gav någon", () => {
    const result = parseReflection({ decisions: [] }, USER_TEXT);
    expect(result.followUpQuestion.length).toBeGreaterThan(0);
  });

  it("kastar aldrig på trasig/oväntad input", () => {
    for (const bad of [null, undefined, "sträng", 42, [], { decisions: "nej" }]) {
      const result = parseReflection(bad as RawReflection, USER_TEXT);
      expect(result.decisions).toEqual([]);
      expect(result.strengths).toEqual([]);
      expect(result.roles).toEqual([]);
      expect(result.followUpQuestion.length).toBeGreaterThan(0);
    }
  });
});

describe("parseReflection — hårda gränser (robusthet)", () => {
  const LONG = "en migrering ".repeat(200); // långt, förankringsbart citat
  const TEXT_WITH_LONG = `Jag genomförde ${LONG} och det gick bra.`;

  it("trunkerar antal decisions till maxgränsen", () => {
    const raw: RawReflection = {
      decisions: Array.from({ length: PARSE_LIMITS.maxDecisions + 15 }, () => ({
        action: "Ledde en migrering",
        capabilities: [],
        sources: ["ledde också ett team på fyra personer"],
      })),
    };
    expect(parseReflection(raw, USER_TEXT).decisions).toHaveLength(
      PARSE_LIMITS.maxDecisions,
    );
  });

  it("trunkerar antal strengths och roles till maxgränserna", () => {
    const raw: RawReflection = {
      strengths: Array.from({ length: PARSE_LIMITS.maxStrengths + 8 }, () => ({
        statement: "Du är bra på ledarskap",
        sources: ["ledde också ett team på fyra personer"],
      })),
      roles: Array.from({ length: PARSE_LIMITS.maxRoles + 8 }, () => ({
        role: "Team Lead",
        rationale: "leder team",
        sources: ["ledde också ett team på fyra personer"],
      })),
    };
    const result = parseReflection(raw, USER_TEXT);
    expect(result.strengths).toHaveLength(PARSE_LIMITS.maxStrengths);
    expect(result.roles).toHaveLength(PARSE_LIMITS.maxRoles);
  });

  it("trunkerar capabilities per decision och sources per post", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Ledde en migrering",
          capabilities: Array.from(
            { length: PARSE_LIMITS.maxCapabilitiesPerDecision + 6 },
            (_unused, i) => `kompetens-${i}`,
          ),
          sources: Array.from(
            { length: PARSE_LIMITS.maxSourcesPerItem + 4 },
            () => "ledde också ett team på fyra personer",
          ),
        },
      ],
    };
    const decision = parseReflection(raw, USER_TEXT).decisions[0];
    expect(decision).toBeDefined();
    expect(decision?.capabilities).toHaveLength(
      PARSE_LIMITS.maxCapabilitiesPerDecision,
    );
    // Alla källor är samma citat → dedup ger 1, väl under maxgränsen.
    expect(decision?.sources.length).toBeLessThanOrEqual(
      PARSE_LIMITS.maxSourcesPerItem,
    );
  });

  it("kapar antal unika källor till maxgränsen", () => {
    // Fem olika förankrade citat + ett sjätte → kapas till 5.
    const raw: RawReflection = {
      strengths: [
        {
          statement: "Bred erfarenhet",
          sources: [
            "Jag byggde om vårt onboarding-flöde",
            "minskade churn med 12 procent",
            "ledde också ett team på fyra personer",
            "genom en stökig migrering",
            "byggde om vårt onboarding-flöde och minskade churn",
            "team på fyra personer genom en stökig migrering",
          ],
        },
      ],
    };
    expect(parseReflection(raw, USER_TEXT).strengths[0]?.sources.length).toBe(
      PARSE_LIMITS.maxSourcesPerItem,
    );
  });

  it("trunkerar extremt långa fält", () => {
    const longAction = "Jag ".concat("byggde ".repeat(400)).trim();
    const raw: RawReflection = {
      decisions: [
        {
          action: longAction,
          capabilities: [],
          sources: ["ledde också ett team på fyra personer"],
        },
      ],
    };
    const action = parseReflection(raw, USER_TEXT).decisions[0]?.action ?? "";
    expect(action.length).toBeLessThanOrEqual(PARSE_LIMITS.maxFieldLength);
    expect(action.endsWith("…")).toBe(true);
  });

  it("trunkerar en lång källa för visning men behåller förankringen på fulltext", () => {
    const raw: RawReflection = {
      strengths: [{ statement: "Erfaren av migreringar", sources: [LONG] }],
    };
    const source = parseReflection(raw, TEXT_WITH_LONG).strengths[0]?.sources[0];
    expect(source).toBeDefined();
    expect(source!.length).toBeLessThanOrEqual(PARSE_LIMITS.maxSourceLength);
  });

  it("filtrerar fortfarande bort oförankrade poster efter härdningen", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Påhittad jätteinsats",
          capabilities: ["allt"],
          sources: ["detta står inte i texten alls"],
        },
      ],
      strengths: [
        { statement: "Ogrundad styrka", sources: ["finns inte heller"] },
      ],
    };
    const result = parseReflection(raw, USER_TEXT);
    expect(result.decisions).toHaveLength(0);
    expect(result.strengths).toHaveLength(0);
  });

  it("kastar aldrig på orimligt stor eller trasig input", () => {
    const huge: RawReflection = {
      decisions: Array.from({ length: 5000 }, () => ({
        action: "x".repeat(5000),
        capabilities: Array.from({ length: 200 }, (_u, i) => `c${i}`),
        sources: Array.from({ length: 200 }, () => "y".repeat(5000)),
      })),
      followUpQuestion: "z".repeat(10000),
    };
    expect(() => parseReflection(huge, USER_TEXT)).not.toThrow();
    const result = parseReflection(huge, USER_TEXT);
    expect(result.decisions.length).toBeLessThanOrEqual(
      PARSE_LIMITS.maxDecisions,
    );
    expect(result.followUpQuestion.length).toBeLessThanOrEqual(
      PARSE_LIMITS.maxFollowUpLength,
    );
  });
});

describe("runReflection", () => {
  it("kör motorn och förankringsvaliderar resultatet", async () => {
    const fakeEngine: AIEngine = {
      reflect: async ({ rawText }) => {
        expect(rawText).toBe(USER_TEXT);
        return {
          decisions: [
            {
              action: "Ledde en migrering",
              capabilities: ["ledarskap"],
              sources: ["ledde också ett team på fyra personer"],
            },
            {
              action: "Påhittad handling",
              capabilities: [],
              sources: ["detta står inte i texten"],
            },
          ],
          followUpQuestion: "Berätta mer om migreringen?",
        } satisfies RawReflection;
      },
    };

    const result = await runReflection(fakeEngine, USER_TEXT);
    // Den oförankrade posten filtreras bort av produktlogiken, inte av motorn.
    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]?.action).toBe("Ledde en migrering");
    expect(result.decisions[0]?.kind).toBe("quote");
    expect(result.followUpQuestion).toBe("Berätta mer om migreringen?");
  });
});
