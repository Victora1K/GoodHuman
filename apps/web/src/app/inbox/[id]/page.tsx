"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Message = {
  id: string;
  body: string;
  senderRole: string;
  createdAt: string;
};

type Inquiry = {
  id: string;
  artistActName: string;
  bookerDisplayName: string;
  city: string;
  eventDate: string;
  eventTimezone: string;
  messages: Message[];
};

export default function InquiryThreadPage() {
  const params = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) {
      setError("Log in to view this thread.");
      return;
    }
    const data = await api<Inquiry>(`/inquiries/${params.id}`, { token });
    setInquiry(data);
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    const fd = new FormData(e.currentTarget);
    try {
      await api(`/inquiries/${params.id}/messages`, {
        token,
        body: { body: String(fd.get("body")) },
      });
      e.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    }
  }

  if (!inquiry && !error) return <section className="section">Loading…</section>;
  if (!inquiry) return <section className="section error">{error}</section>;

  return (
    <section className="section stack">
      <h1>
        {inquiry.artistActName} · {inquiry.bookerDisplayName}
      </h1>
      <p className="meta">
        {inquiry.city} · {inquiry.eventDate} ({inquiry.eventTimezone})
      </p>
      <div className="thread">
        {inquiry.messages.map((m) => (
          <div key={m.id} className="bubble">
            <div className="meta">
              {m.senderRole} · {new Date(m.createdAt).toLocaleString()}
            </div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
      <form className="form" onSubmit={send}>
        <label>
          Reply
          <textarea name="body" rows={3} required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit">
          Send
        </button>
      </form>
    </section>
  );
}
