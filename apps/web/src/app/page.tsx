import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="hero-brand">GoodHuman</p>
        <h1>Find artists. Keep the work clear.</h1>
        <p>
          Profiles, travel scope, availability, and inquiry chat — built for the
          people who show up and play.
        </p>
        <div className="hero-actions">
          <Link className="btn" href="/signup">
            Get started
          </Link>
          <Link className="btn secondary" href="/search">
            Search artists
          </Link>
        </div>
      </div>
    </section>
  );
}
