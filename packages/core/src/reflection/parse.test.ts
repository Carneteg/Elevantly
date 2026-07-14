import { describe, expect, it } from "vitest";
import { isGrounded, parseReflection } from "./parse";
import { runReflection } from "./runReflection";
import type { AIEngine, RawReflection } from "../ai/engine";

/**
 * Kritisk affärslogik (CLAUDE.md 16): struktureringen av fritext till
 * förankrade beslutsposter. Testerna är deterministiska och kräver ingen
 * riktig AI-motor — de matar in fixtur-JSON precis som en motor skulle svara.
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
  it("strukturerar ett giltigt svar till typade, förankrade poster", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Byggde om onboarding-flödet",
          context: "internt produktarbete",
          outcome: "minskade churn med 12 procent",
          capabilities: ["produktutveckling", "dataanalys"],
          sourceText: "minskade churn med 12 procent",
        },
      ],
      strengths: [
        {
          statement: "Du driver mätbar produktförbättring",
          sourceText: "minskade churn med 12 procent",
        },
      ],
      roles: [
        {
          role: "Product Manager",
          rationale: "Kombinerar produktbeslut med mätbart utfall",
          sourceText: "byggde om vårt onboarding-flöde",
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
      sourceText: "minskade churn med 12 procent",
    });
    expect(result.strengths).toHaveLength(1);
    expect(result.roles).toHaveLength(1);
    expect(result.followUpQuestion).toBe("Vad var svårast i migreringen?");
  });

  it("filtrerar bort en decision vars sourceText inte finns i texten", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Lanserade en helt ny betaltjänst",
          capabilities: ["fintech"],
          sourceText: "lanserade en betaltjänst som tog 40% marknadsandel",
        },
      ],
    };

    const result = parseReflection(raw, USER_TEXT);
    expect(result.decisions).toHaveLength(0);
  });

  it("filtrerar bort en decision utan sourceText (ingen spårbar källa)", () => {
    const raw: RawReflection = {
      decisions: [
        {
          action: "Ledde ett team",
          capabilities: ["ledarskap"],
          sourceText: "",
        },
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
          sourceText: "ledde också ett team på fyra personer",
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
          sourceText: "ledde också ett team på fyra personer",
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

  it("underkänner en förankrad strength men behåller inte en oförankrad", () => {
    const raw: RawReflection = {
      strengths: [
        {
          statement: "Du är bra på ledarskap",
          sourceText: "ledde också ett team på fyra personer",
        },
        {
          statement: "Du är en visionär strateg",
          sourceText: "byggde en tioårig strategi",
        },
      ],
    };

    const result = parseReflection(raw, USER_TEXT);
    expect(result.strengths).toHaveLength(1);
    expect(result.strengths[0]?.statement).toBe("Du är bra på ledarskap");
  });

  it("kräver förankrat sourceText även för roller", () => {
    const raw: RawReflection = {
      roles: [
        {
          role: "CTO",
          rationale: "byggde hela plattformen",
          sourceText: "byggde hela plattformen själv på en helg",
        },
      ],
    };

    expect(parseReflection(raw, USER_TEXT).roles).toHaveLength(0);
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
              sourceText: "ledde också ett team på fyra personer",
            },
            {
              action: "Påhittad handling",
              capabilities: [],
              sourceText: "detta står inte i texten",
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
    expect(result.followUpQuestion).toBe("Berätta mer om migreringen?");
  });
});
