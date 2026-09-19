export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>
          <strong style={{ color: "var(--text)" }}>CarbonTrace Lite</strong>
          <span style={{ margin: "0 0.5rem" }}>·</span>© 2026 CarbonTrace Open Protocol. Satellite &amp; geospatial
          data verified independently.
        </span>
        <nav className="footer-links">
          <a href="/">Ledger Explorer</a>
          <a href="/">Methodology</a>
          <a href="/">Audit Logs</a>
          <a href="/">API Docs</a>
          <a href="/">Terms of Service</a>
        </nav>
      </div>
    </footer>
  );
}
