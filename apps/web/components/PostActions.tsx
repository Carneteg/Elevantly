"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Ta bort ett eget inlägg. Visas bara för författaren (kontrolleras server-sidan);
 * RLS är den faktiska spärren. Efter borttagning hämtas serverns sanning på nytt.
 */
export function PostActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: postId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="text-sm text-[var(--color-muted)] underline transition hover:text-[var(--color-ink)] disabled:opacity-40"
    >
      Ta bort
    </button>
  );
}
