"use client";

import { FormEvent, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setSession, type AuthUser } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"ARTIST" | "BOOKER">("ARTIST");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await api<{ token: string; user: AuthUser }>("/auth/signup", {
        body: {
          email: String(fd.get("email")),
          password: String(fd.get("password")),
          displayName: String(fd.get("displayName")),
          role,
          ageConfirmed18Plus: fd.get("age") === "on",
          bookerSubtype: role === "BOOKER" ? String(fd.get("bookerSubtype") || "INDIVIDUAL") : undefined,
          venueAddress:
            role === "BOOKER" && fd.get("bookerSubtype") === "VENUE"
              ? String(fd.get("venueAddress") || "")
              : undefined,
        },
      });
      setSession(res.token, res.user);
      startTransition(() => {
        router.push(role === "ARTIST" ? "/artist" : "/search");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  }

  return (
    <section className="section stack">
      <h1>Join GoodHuman</h1>
      <p>Free to join. You must be 18 or older. GoodHuman is not a law firm.</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          I am a
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "ARTIST" | "BOOKER")}
          >
            <option value="ARTIST">Artist</option>
            <option value="BOOKER">Booker</option>
          </select>
        </label>
        <label>
          Display name
          <input name="displayName" required maxLength={120} />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength={8} required />
        </label>
        {role === "BOOKER" ? (
          <>
            <label>
              Booker type
              <select name="bookerSubtype" defaultValue="INDIVIDUAL">
                <option value="INDIVIDUAL">Individual</option>
                <option value="VENUE">Venue</option>
                <option value="PROMOTER">Promoter</option>
                <option value="PLANNER">Planner</option>
              </select>
            </label>
            <label>
              Venue address (if venue)
              <input name="venueAddress" />
            </label>
          </>
        ) : null}
        <label style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
          <input name="age" type="checkbox" required />
          I confirm I am 18 or older
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit">
          Create account
        </button>
      </form>
      <p className="notice">
        By continuing you agree to the forthcoming Terms and Privacy Policy covering
        profile data, messages, contracts, files, and payment data processed by Stripe.
      </p>
    </section>
  );
}
