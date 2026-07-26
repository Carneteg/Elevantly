"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Den återkommande navigeringen i den globala ramen. Visar var användaren är
 * (aktiv markering + `aria-current`), en kontomeny (disclosure med aria-expanded,
 * Escape och klick-utanför), och blir en fast bottombar på mobil. Bara det som
 * faktiskt finns visas — inga döda länkar till obyggda funktioner (CLAUDE.md 6.3).
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function MainNav({
  signedIn,
  email,
  initial,
}: {
  signedIn: boolean;
  email: string | null;
  initial: string;
}) {
  const pathname = usePathname();

  const items: NavItem[] = signedIn
    ? [
        { href: "/", label: "Hem", icon: <HomeIcon /> },
        { href: "/feed", label: "Flöde", icon: <FeedIcon /> },
        { href: "/network", label: "Nätverk", icon: <NetworkIcon /> },
        { href: "/messages", label: "Meddelanden", icon: <MessageIcon /> },
      ]
    : [{ href: "/", label: "Hem", icon: <HomeIcon /> }];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Primär navigering — i toppen på desktop, dold på mobil (bottombar nedan). */}
      <nav aria-label="Huvudnavigering" className="hidden sm:block">
        <ul className="flex items-center gap-1">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "bg-[var(--color-ink)] text-white"
                    : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Konto: meny för inloggad, annars logga in-länk. */}
      <div className="flex items-center">
        {signedIn ? (
          <AccountMenu email={email} initial={initial} />
        ) : (
          <a
            href="/login"
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Logga in
          </a>
        )}
      </div>

      {/* Mobil: fast bottombar med de viktigaste destinationerna. */}
      {signedIn && (
        <nav
          aria-label="Huvudnavigering (mobil)"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-canvas)] sm:hidden"
        >
          <ul className="flex items-stretch justify-around">
            {[...items, { href: "/profile", label: "Profil", icon: <ProfileIcon /> }].map(
              (item) => (
                <li key={item.href} className="flex-1">
                  <a
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex flex-col items-center gap-1 py-2 text-xs font-medium transition ${
                      isActive(item.href)
                        ? "text-[var(--color-ink)]"
                        : "text-[var(--color-muted)]"
                    }`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>
      )}
    </>
  );
}

/** Kontomeny — en tillgänglig disclosure (aria-expanded, Escape, klick-utanför). */
function AccountMenu({
  email,
  initial,
}: {
  email: string | null;
  initial: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={email ? `Kontomeny (${email})` : "Kontomeny"}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm font-semibold text-white transition hover:opacity-90"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[var(--color-line)] bg-white p-2 shadow-lg">
          {email && (
            <p className="truncate px-3 py-2 text-sm text-[var(--color-muted)]">
              {email}
            </p>
          )}
          <a
            href="/profile"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-canvas)]"
          >
            Min profil
          </a>
          <a
            href="/network"
            className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-canvas)]"
          >
            Nätverk
          </a>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--color-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
            >
              Logga ut
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.5a3 3 0 0 1 0 6M17 14c2.3.6 4 2.7 4 5" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H8l-4 3.5V5z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </svg>
  );
}
