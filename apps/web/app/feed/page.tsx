import { redirect } from "next/navigation";
import {
  otherParty,
  SupabaseConnectionRepository,
  SupabasePostRepository,
  SupabaseProfileRepository,
} from "@elevantly/core";
import type { Post, PublicProfileSummary } from "@elevantly/core";
import { createClient } from "@/lib/supabase/server";
import { PostComposer } from "@/components/PostComposer";
import { PostActions } from "@/components/PostActions";
import { ReportButton } from "@/components/ReportButton";

/**
 * Flöde — dela något med ditt nätverk och se vad dina kontakter delar. Skyddad
 * (kräver inloggning). Row-level security gör att du bara ser inlägg från dig
 * själv och dina accepterade kontakter. Kronologiskt, nyast först — förklarbar
 * ordning, ingen doomscroll-optimering (CLAUDE.md 8.5 / 11).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FEED_LIMIT = 100;

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const connections = new SupabaseConnectionRepository(supabase);
  const profiles = new SupabaseProfileRepository(supabase);
  const posts = new SupabasePostRepository(supabase);

  const accepted = await connections.listAccepted(user.id);
  const contactIds = accepted.map((c) => otherParty(c, user.id));
  const authorIds = [user.id, ...contactIds];

  const [feed, summaries, ownProfile] = await Promise.all([
    posts.listByAuthors(authorIds, FEED_LIMIT),
    profiles.loadPublicSummariesByIds(contactIds),
    profiles.load(user.id),
  ]);
  const byId = new Map(summaries.map((s) => [s.userId, s]));

  // Egna beslut som ett inlägg kan grundas i (index matchar profilens ordning —
  // servern validerar indexet vid publicering).
  const decisionOptions = (ownProfile?.decisions ?? []).map((d, index) => ({
    index,
    label: truncate(d.outcome ? `${d.action} → ${d.outcome}` : d.action, 80),
  }));

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col px-6 py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Flöde
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
          Ditt nätverk
        </h1>
      </header>

      <div className="mb-10">
        <PostComposer decisions={decisionOptions} />
      </div>

      <section aria-label="Flöde">
        {feed.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-line)] bg-white/50 p-6">
            <p className="text-lg leading-snug">Ditt flöde är tomt än så länge.</p>
            <p className="mt-2 text-[var(--color-muted)]">
              Dela något ovan, eller{" "}
              <a href="/network" className="underline">
                bygg ditt nätverk
              </a>{" "}
              — inlägg från dina kontakter dyker upp här, nyast först.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {feed.map((post) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  isOwn={post.authorId === user.id}
                  author={byId.get(post.authorId) ?? null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function PostCard({
  post,
  isOwn,
  author,
}: {
  post: Post;
  isOwn: boolean;
  author: PublicProfileSummary | null;
}) {
  return (
    <article className="rounded-xl border border-[var(--color-line)] bg-white/50 p-5">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <AuthorName isOwn={isOwn} author={author} />
          <p className="text-sm text-[var(--color-muted)]">
            {formatTimestamp(post.createdAt)}
          </p>
        </div>
        {isOwn && <PostActions postId={post.id} />}
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words leading-snug">
        {post.body}
      </p>
      {post.groundedIn && (
        <p className="mt-3 inline-flex flex-wrap items-baseline gap-1.5 rounded-lg bg-[var(--color-accent)]/10 px-3 py-2 text-sm text-[var(--color-accent)]">
          <span aria-hidden="true">◆</span>
          <span>
            <span className="font-medium">Grundat i ett beslut:</span>{" "}
            {post.groundedIn.action}
            {post.groundedIn.outcome ? ` → ${post.groundedIn.outcome}` : ""}
          </span>
        </p>
      )}
      {!isOwn && (
        <div className="mt-3">
          <ReportButton subjectType="post" subjectId={post.id} />
        </div>
      )}
    </article>
  );
}

function AuthorName({
  isOwn,
  author,
}: {
  isOwn: boolean;
  author: PublicProfileSummary | null;
}) {
  if (isOwn) return <p className="font-medium">Du</p>;
  if (!author) return <p className="font-medium">Elevantly-användare</p>;
  return (
    <a href={`/u/${author.handle}`} className="font-medium underline">
      {author.displayName ?? `@${author.handle}`}
    </a>
  );
}

/** Kortar en etikett till `max` tecken (för besluts-väljaren). */
function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Enkel, läsbar tidsstämpel (sv-SE). */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
