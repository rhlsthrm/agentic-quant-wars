import { useState } from 'react';
import { motion } from 'framer-motion';
import './PredictSection.css';

const JUPITER_URL = 'https://jup.ag/prediction/POLY-190338';
const KALSHI_URL = 'https://kalshi.com/markets/kxtopmodel/top-model/kxtopmodel-26feb28';

export default function PredictSection() {
  const [iframeError, setIframeError] = useState(false);

  return (
    <section id="predict" className="predict-section section section-gap">
      <div className="section-header">
        <div className="section-label">Participate</div>
        <h2 className="section-title">
          Make Your <span className="accent">Prediction</span>
        </h2>
        <p className="section-subtitle">
          Turn from spectator to participant. Trade prediction markets
          and put your conviction on the line.
        </p>
      </div>

      <motion.div
        className="predict-container"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
      >
        {/* Header bar with logos */}
        <div className="predict-header">
          <div className="predict-header-left">
            <div className="predict-powered-logos">
              <img src="/logos/jupiter.png" alt="Jupiter" height={22} className="predict-partner-logo" style={{ borderRadius: '50%' }} />
              <span className="predict-powered-x">&times;</span>
              <img src="/logos/dflow.png" alt="dFlow" height={22} className="predict-partner-logo" style={{ borderRadius: '4px' }} />
              <span className="predict-powered-x">&times;</span>
              <img src="/logos/kalshi.png" alt="Kalshi" height={20} className="predict-partner-logo" />
            </div>
            <span className="predict-badge">Prediction Market</span>
          </div>
          <a
            href={JUPITER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="predict-external"
          >
            Open on Jupiter
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 12L12 4M12 4H6M12 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        {/* Jupiter iframe embed */}
        {!iframeError && (
          <div className="predict-iframe-wrapper">
            <iframe
              src={JUPITER_URL}
              title="Jupiter Prediction Market"
              className="predict-iframe"
              frameBorder="0"
              allow="clipboard-write"
              onError={() => setIframeError(true)}
            />
          </div>
        )}

        {/* Fallback market card (shown if iframe fails or as supplementary) */}
        {iframeError && (
          <a
            href={JUPITER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="predict-market-card"
          >
            <div className="pmc-top">
              <div className="pmc-category">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                AI &amp; Technology
              </div>
              <div className="pmc-live-tag">
                <span className="pmc-live-dot" />
                LIVE MARKET
              </div>
            </div>

            <h3 className="pmc-title">Which AI model will be the top performer?</h3>
            <p className="pmc-description">
              Trade on the outcome of the Agentic Quant Wars competition on Jupiter.
              Powered by dFlow and Kalshi prediction markets.
            </p>

            <div className="pmc-agents">
              <div className="pmc-agent">
                <span className="pmc-dot" style={{ background: '#10a37f' }} />
                <span>GPT-4o</span>
              </div>
              <div className="pmc-agent">
                <span className="pmc-dot" style={{ background: '#d4a574' }} />
                <span>Claude Opus</span>
              </div>
              <div className="pmc-agent">
                <span className="pmc-dot" style={{ background: '#4285f4' }} />
                <span>Gemini Ultra</span>
              </div>
              <div className="pmc-agent">
                <span className="pmc-dot" style={{ background: '#f5f5f5' }} />
                <span>Grok-3</span>
              </div>
              <div className="pmc-agent">
                <span className="pmc-dot" style={{ background: '#6c5ce7' }} />
                <span>DeepSeek-R1</span>
              </div>
            </div>

            <div className="pmc-action">
              <span className="pmc-action-text">Trade this market on Jupiter</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </a>
        )}

        {/* Bottom CTA */}
        <div className="predict-footer">
          <div className="predict-footer-info">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="predict-info-icon">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 7v4M8 5.5V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Powered by Jupiter, dFlow &amp; Kalshi — CFTC-regulated prediction markets</span>
          </div>
          <a
            href={JUPITER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="predict-cta"
          >
            Place Your Prediction
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
