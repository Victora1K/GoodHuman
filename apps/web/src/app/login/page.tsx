"use client";

import { FormEvent, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setSession, type AuthUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api<{ token: string; user: AuthUser }>("/auth/login", {
        body: {
          email: String(fd.get("email")),
          password: String(fd.get("password")),
        },
      });
      setSession(res.token, res.user);
      startTransition(() => {
        router.push(res.user.role === "ARTIST" ? "/artist" : "/search");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <section className="section stack">
      <h1>Log in to GoodHuman</h1>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit">
          Log in
        </button>
      </form>
    </section>
  );
}
