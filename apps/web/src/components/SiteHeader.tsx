"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  AUTH_EVENT,
  clearSession,
  getToken,
  getUser,
  setSession,
  type AuthUser,
} from "@/lib/auth";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
        return;
      }

      const cached = getUser();
      if (cached) {
        if (!cancelled) {
          setUser(cached);
          setReady(true);
        }
        return;
      }

      try {
        const me = await api<AuthUser>("/auth/me", { token });
        setSession(token, me);
        if (!cancelled) {
          setUser(me);
          setReady(true);
        }
      } catch {
        clearSession();
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
      }
    }

    void sync();
    const onAuth = () => {
      void sync();
    };
    window.addEventListener(AUTH_EVENT, onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EVENT, onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, [pathname]);

  function logOut() {
    clearSession();
    router.push("/");
  }

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        GoodHuman
      </Link>
      <nav className="nav" aria-label="Primary">
        <Link href="/search">Search</Link>
        <Link href="/artist">Artist home</Link>
        <Link href="/inbox">Inbox</Link>
        {ready && user ? (
          <>
            <span className="nav-user" aria-label="Signed in as">
              {user.displayName}
            </span>
            <button type="button" className="nav-logout" onClick={logOut}>
              Log out
            </button>
          </>
        ) : ready ? (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </>
        ) : null}
      </nav>
    </header>
  );
}
