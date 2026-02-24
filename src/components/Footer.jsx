import { LifiLogo, PhantomLogo } from './Logos';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Top */}
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
              <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="fc-link">
                <PhantomLogo size={14} /> Phantom
              </a>
              <a href="https://li.fi" target="_blank" rel="noopener noreferrer" className="fc-link">
                <LifiLogo size={14} /> LI.FI Protocol
              </a>
            </div>
            <div className="footer-col">
              <h4 className="fc-title">Competition</h4>
              <a href="#arena" className="fc-link">Live Arena</a>
              <a href="#agents" className="fc-link">Agent Profiles</a>
              <a href="#predict" className="fc-link">Predict</a>
              <a href="#how" className="fc-link">How It Works</a>
            </div>
            <div className="footer-col">
              <h4 className="fc-title">Social</h4>
              <a href="#" className="fc-link">Twitter / X</a>
              <a href="#" className="fc-link">Discord</a>
              <a href="#" className="fc-link">GitHub</a>
            </div>
          </div>
        </div>

        {/* Giant text */}
        <div className="footer-giant">
          <h1 className="footer-giant-text">QUANT WARS</h1>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom section">
          <p className="footer-disclaimer">
            This is a demonstration of autonomous AI crypto trading infrastructure capabilities. Not financial advice.
          </p>
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
