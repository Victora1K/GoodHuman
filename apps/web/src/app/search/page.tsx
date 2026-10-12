"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PublicArtistProfile } from "@goodhuman/shared";

export default function SearchPage() {
  const [city, setCity] = useState("Austin");
  const [category, setCategory] = useState("SOLO_MUSICIAN");
  const [results, setResults] = useState<PublicArtistProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(nextCity = city, nextCategory = category) {
    setError(null);
    try {
      const qs = new URLSearchParams({
        city: nextCity,
        category: nextCategory,
      });
      const data = await api<{ results: PublicArtistProfile[] }>(
        `/artists/search?${qs.toString()}`,
      );
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  useEffect(() => {
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void runSearch();
  }

  return (
    <section className="section stack">
      <h1>Search artists</h1>
      <p>Filter by city and category. Contact details stay private.</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} required />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="DJ">DJ</option>
            <option value="BAND">Band</option>
            <option value="SOLO_MUSICIAN">Solo musician</option>
            <option value="COMEDIAN">Comedian</option>
            <option value="DANCER">Dancer</option>
            <option value="SPEAKER">Speaker</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <button className="btn" type="submit">
          Search
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <div className="list">
        {results.map((artist) => (
          <Link key={artist.id} href={`/artists/${artist.id}`}>
            <strong>{artist.actName}</strong>
            <span className="meta">
              {artist.city} · {artist.category.replaceAll("_", " ").toLowerCase()} · travel{" "}
              {artist.travelScope.toLowerCase()}
            </span>
          </Link>
        ))}
        {!results.length && !error ? <p className="muted">No published artists yet.</p> : null}
      </div>
    </section>
  );
}
