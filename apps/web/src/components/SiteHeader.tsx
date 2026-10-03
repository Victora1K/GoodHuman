import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        GoodHuman
      </Link>
      <nav className="nav" aria-label="Primary">
        <Link href="/search">Search</Link>
        <Link href="/login">Log in</Link>
        <Link href="/signup">Sign up</Link>
        <Link href="/artist">Artist home</Link>
        <Link href="/inbox">Inbox</Link>
      </nav>
    </header>
  );
}
