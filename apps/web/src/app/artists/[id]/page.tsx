"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { PublicArtistProfile } from "@goodhuman/shared";

export default function ArtistPublicPage() {
  const params = useParams<{ id: string }>();
  const [artist, setArtist] = useState<PublicArtistProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void api<PublicArtistProfile>(`/artists/${params.id}`)
      .then(setArtist)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [params.id]);

  async function sendInquiry(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const token = getToken();
    if (!token) {
      setError("Log in as a booker to send an inquiry.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    try {
      await api("/inquiries", {
        token,
        body: {
          artistProfileId: params.id,
          eventDate: String(fd.get("eventDate")),
          eventTimezone: String(fd.get("eventTimezone")),
          city: String(fd.get("city")),
          venueName: String(fd.get("venueName") || "") || undefined,
          message: String(fd.get("message")),
        },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send inquiry");
    }
  }

  if (!artist && !error) return <section className="section">Loading…</section>;
  if (!artist) return <section className="section error">{error}</section>;

  const image = artist.media.find((m) => m.kind === "IMAGE" && m.previewUrl);

  return (
    <section className="section stack">
      <h1>{artist.actName}</h1>
      <p className="meta">
        {artist.city}, {artist.country}
        {artist.region ? ` · ${artist.region}` : ""} · {artist.category.replaceAll("_", " ")}
      </p>
      <p>{artist.bio}</p>
      <p className="meta">
        Open to travel: {artist.openToTravel ? "yes" : "no"} ({artist.travelScope.toLowerCase()})
      </p>

      {image?.previewUrl ? (
        <div className="preview-frame">
          {/* preview URLs are watermarked public previews, never originals */}
          <img src={image.previewUrl} alt={`${artist.actName} preview`} />
        </div>
      ) : null}

      <div>
        <h2>Open dates</h2>
        <ul>
          {artist.availability.map((d) => (
            <li key={d.date}>
              {d.date} ({d.timezone})
            </li>
          ))}
        </ul>
      </div>

      {artist.socialLinks.length ? (
        <div>
          <h2>Links</h2>
          <ul>
            {artist.socialLinks.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.platform}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="stack">
        <h2>Send an inquiry</h2>
        {sent ? (
          <p>Inquiry sent. Continue in Inbox.</p>
        ) : (
          <form className="form" onSubmit={sendInquiry}>
            <label>
              Event date
              <input name="eventDate" type="date" required />
            </label>
            <label>
              Event timezone
              <input name="eventTimezone" defaultValue="America/Chicago" required />
            </label>
            <label>
              City
              <input name="city" defaultValue={artist.city} required />
            </label>
            <label>
              Venue name
              <input name="venueName" />
            </label>
            <label>
              Message
              <textarea name="message" rows={4} required />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn" type="submit">
              Send inquiry
            </button>
          </form>
        )}
      </div>

      <p className="notice">
        Artist email and phone are never shown on public profiles. Preview media is
        watermarked; originals stay private.
      </p>
    </section>
  );
}
