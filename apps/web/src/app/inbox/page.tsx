"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

type InquiryListItem = {
  id: string;
  artistActName: string;
  bookerDisplayName: string;
  city: string;
  eventDate: string;
  latestMessage?: { body: string } | null;
};

export default function InboxPage() {
  const [items, setItems] = useState<InquiryListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("Log in to view inquiries.");
      return;
    }
    void api<{ results: InquiryListItem[] }>("/inquiries", { token })
      .then((data) => setItems(data.results))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  return (
    <section className="section stack">
      <h1>Inbox</h1>
      <p>Inquiry threads between artists and bookers.</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="list">
        {items.map((item) => (
          <Link key={item.id} href={`/inbox/${item.id}`}>
            <strong>
              {item.artistActName} · {item.bookerDisplayName}
            </strong>
            <span className="meta">
              {item.city} · {item.eventDate}
              {item.latestMessage ? ` · ${item.latestMessage.body}` : ""}
            </span>
          </Link>
        ))}
        {!items.length && !error ? <p className="muted">No inquiries yet.</p> : null}
      </div>
    </section>
  );
}
