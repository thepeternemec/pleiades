/**
 * Site navigation. Plain anchors rather than next/link on purpose: a full load
 * guarantees each page mounts cleanly, so the scroll-reveal controller and the
 * code-box animations initialise the same way on every route.
 */
const LINKS = [
  { href: "/payment", label: "Payment" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
];

export default function SiteNav({ active }: { active?: string }) {
  return (
    <nav className="nav">
      <div className="nav-pill">
        <a className="nav-logo" href="/">
          PLEIADES <i /> <small>agent rail</small>
        </a>
        <span className="nav-links">
          {LINKS.map((link) => (
            <a
              key={link.href}
              className="nav-link"
              href={link.href}
              style={active === link.href ? { color: "#fff" } : undefined}
            >
              {link.label}
            </a>
          ))}
        </span>
        <a className="nav-cta" href="/dashboard">
          Open terminal
        </a>
      </div>
    </nav>
  );
}
