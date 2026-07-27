import { describe, expect, it } from "vitest";
import { InMemoryApplicationRepository } from "./inMemoryApplicationRepository";
import { isApplicationStatus } from "./application";
import type { ApplicationInput } from "./application";
import type { Decision } from "../decision";

const T1 = "2026-01-01T00:00:00.000Z";
const T2 = "2026-02-02T00:00:00.000Z";

const DECISION: Decision = {
  action: "Ledde en omställning",
  capabilities: [],
  responsibility: "led",
  sources: ["citat"],
  kind: "quote",
};

function input(overrides: Partial<ApplicationInput> = {}): ApplicationInput {
  return {
    candidateName: "Tobias",
    candidateHeadline: "Produkt & teknik",
    decisions: [DECISION],
    ...overrides,
  };
}

describe("ansökningsstatus", () => {
  it("känner igen giltiga statusvärden", () => {
    expect(isApplicationStatus("submitted")).toBe(true);
    expect(isApplicationStatus("accepted")).toBe(true);
    expect(isApplicationStatus("klar")).toBe(false);
  });
});

describe("InMemoryApplicationRepository", () => {
  it("skapar en ansökan med ögonblicksbild och startar som submitted", async () => {
    const repo = new InMemoryApplicationRepository();
    const app = await repo.apply("job-1", "c1", "u1", input({ message: "  Hej!  " }), T1);
    expect(app.id).toBeTruthy();
    expect(app.status).toBe("submitted");
    expect(app.decisions).toEqual([DECISION]);
    expect(app.candidateName).toBe("Tobias");
    expect(app.message).toBe("Hej!");
  });

  it("vägrar en dubbelansökan på samma jobb", async () => {
    const repo = new InMemoryApplicationRepository();
    await repo.apply("job-1", "c1", "u1", input(), T1);
    await expect(repo.apply("job-1", "c1", "u1", input(), T2)).rejects.toThrow();
    // Annan kandidat får söka samma jobb.
    await expect(repo.apply("job-1", "c1", "u2", input(), T2)).resolves.toBeTruthy();
  });

  it("listar kandidatens egna ansökningar, nyast först", async () => {
    const repo = new InMemoryApplicationRepository();
    await repo.apply("job-1", "c1", "u1", input(), T1);
    await repo.apply("job-2", "c1", "u1", input(), T2);
    await repo.apply("job-1", "c1", "u2", input(), T2);

    const mine = await repo.listForCandidate("u1");
    expect(mine.map((a) => a.jobId)).toEqual(["job-2", "job-1"]);
  });

  it("listar ansökningar till ett jobb (för arbetsgivaren)", async () => {
    const repo = new InMemoryApplicationRepository();
    await repo.apply("job-1", "c1", "u1", input(), T1);
    await repo.apply("job-1", "c1", "u2", input(), T2);
    await repo.apply("job-2", "c1", "u1", input(), T2);

    const applicants = await repo.listForJob("job-1");
    expect(applicants.map((a) => a.candidateId)).toEqual(["u2", "u1"]);
  });

  it("setStatus ändrar ansökans status", async () => {
    const repo = new InMemoryApplicationRepository();
    const app = await repo.apply("job-1", "c1", "u1", input(), T1);
    await repo.setStatus(app.id, "accepted");
    expect((await repo.listForCandidate("u1"))[0]?.status).toBe("accepted");
  });

  it("isolerar ögonblicksbilden från extern mutation", async () => {
    const repo = new InMemoryApplicationRepository();
    const app = await repo.apply("job-1", "c1", "u1", input(), T1);
    app.decisions[0]!.action = "manipulerad";
    const [fresh] = await repo.listForJob("job-1");
    expect(fresh?.decisions[0]?.action).toBe("Ledde en omställning");
  });
});
