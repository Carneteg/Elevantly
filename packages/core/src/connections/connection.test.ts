import { describe, expect, it } from "vitest";
import {
  canRequest,
  isParty,
  otherParty,
  relationshipState,
} from "./connection";
import type { Connection } from "./connection";

function connection(overrides: Partial<Connection> = {}): Connection {
  return {
    requesterId: "a",
    addresseeId: "b",
    status: "pending",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("canRequest", () => {
  it("tillåter en förfrågan mellan två olika användare", () => {
    expect(canRequest("a", "b")).toBe(true);
  });

  it("nekar en förfrågan till sig själv", () => {
    expect(canRequest("a", "a")).toBe(false);
  });

  it("nekar tomma id:n", () => {
    expect(canRequest("", "b")).toBe(false);
    expect(canRequest("a", "")).toBe(false);
  });
});

describe("relationshipState", () => {
  it("self när det är samma person", () => {
    expect(relationshipState(null, "a", "a")).toBe("self");
  });

  it("none när ingen koppling finns", () => {
    expect(relationshipState(null, "a", "b")).toBe("none");
  });

  it("connected när kopplingen är accepterad", () => {
    const c = connection({ status: "accepted" });
    expect(relationshipState(c, "a", "b")).toBe("connected");
    expect(relationshipState(c, "b", "a")).toBe("connected");
  });

  it("outgoing_pending för avsändaren av en väntande förfrågan", () => {
    const c = connection({ requesterId: "a", addresseeId: "b" });
    expect(relationshipState(c, "a", "b")).toBe("outgoing_pending");
  });

  it("incoming_pending för mottagaren av en väntande förfrågan", () => {
    const c = connection({ requesterId: "a", addresseeId: "b" });
    expect(relationshipState(c, "b", "a")).toBe("incoming_pending");
  });
});

describe("isParty / otherParty", () => {
  it("isParty är sant för båda parterna, falskt för utomstående", () => {
    const c = connection({ requesterId: "a", addresseeId: "b" });
    expect(isParty(c, "a")).toBe(true);
    expect(isParty(c, "b")).toBe(true);
    expect(isParty(c, "c")).toBe(false);
  });

  it("otherParty ger motparten", () => {
    const c = connection({ requesterId: "a", addresseeId: "b" });
    expect(otherParty(c, "a")).toBe("b");
    expect(otherParty(c, "b")).toBe("a");
  });
});
