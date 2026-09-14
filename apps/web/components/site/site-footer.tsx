export default function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="footer-row">
          <div className="footer-brand-line">
            <span className="footer-co">PLEIADES</span>
            <span style={{ color: "var(--border-strong)" }}>/</span>
            <span className="footer-address">agent rail · spec v1</span>
          </div>
          <div className="footer-links">
            <a href="/dashboard">Terminal</a>
            <a href="/pricing">Pricing</a>
            <a href="/docs">Docs</a>
            <a href="/faq">FAQ</a>
            <a href="https://github.com/thepeternemec/pleiades">GitHub</a>
          </div>
        </div>
        <div className="footer-row" style={{ marginTop: 10 }}>
          <span className="footer-address">
            the real-time news API for AI agents · paid per call in USDC on Solana
          </span>
        </div>
      </div>
    </footer>
  );
}
