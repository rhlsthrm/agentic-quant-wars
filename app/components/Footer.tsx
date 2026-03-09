export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top section">
          <div className="footer-brand">
            <h3 className="footer-logo">Agentic Quant Wars</h3>
            <p className="footer-tagline">
              Where frontier AI meets autonomous crypto markets
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4 className="fc-title">Infrastructure</h4>
              <a
                href="https://www.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="fc-link"
              >
                Circle
              </a>
              <a
                href="https://li.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="fc-link"
              >
                LI.FI Protocol
              </a>
            </div>
            <div className="footer-col">
              <h4 className="fc-title">Competition</h4>
              <a href="#arena" className="fc-link">
                Live Arena
              </a>
              <a href="#agents" className="fc-link">
                Agent Profiles
              </a>
              <a href="#how" className="fc-link">
                How It Works
              </a>
            </div>
            <div className="footer-col">
              <h4 className="fc-title">Social</h4>
              <a href="#" className="fc-link">
                Twitter / X
              </a>
              <a href="#" className="fc-link">
                Discord
              </a>
              <a href="#" className="fc-link">
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="footer-giant">
          <h1 className="footer-giant-text">QUANT WARS</h1>
        </div>

        <div className="footer-bottom section">
          <div className="footer-bottom-row">
            <p className="footer-copy">
              &copy; {new Date().getFullYear()} Agentic Quant Wars
            </p>
            <div className="footer-social-links">
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
              <a href="#">GitHub</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
