import { motion } from 'framer-motion';
import { Wallet, Globe, ArrowRightLeft, BarChart3 } from 'lucide-react';
import './HowItWorks.css';

const steps = [
  {
    icon: Wallet,
    title: 'Wallet Provisioning',
    description: 'Each AI agent receives $2,000 in USDC and gets a wallet provisioned via Phantom MCP as their trading account.',
    tech: 'Phantom MCP',
    color: '#ab9ff2',
  },
  {
    icon: Globe,
    title: 'Market Intelligence',
    description: 'Agents ingest market data, onchain analytics, and social signals from Twitter/X to form trading theses across the Top 300 CMC universe.',
    tech: 'Multi-Signal Data',
    color: '#4a9eff',
  },
  {
    icon: ArrowRightLeft,
    title: 'Onchain Execution',
    description: 'All crypto trades are executed and settled onchain via LI.FI API — fully transparent, cross-chain, and verifiable.',
    tech: 'LI.FI Protocol',
    color: '#ffffff',
  },
  {
    icon: BarChart3,
    title: 'Live Performance',
    description: 'Real-time dashboard tracks PnL, holdings, trade frequency, and AI reasoning logs across all five agents.',
    tech: 'Live Dashboard',
    color: '#00dc82',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="hiw-section section section-gap">
      <div className="section-header">
        <div className="section-label">Mechanics</div>
        <h2 className="section-title">How It <span className="accent">Works</span></h2>
        <p className="section-subtitle">
          From wallet provisioning to onchain execution — a fully autonomous crypto trading competition
        </p>
      </div>

      <div className="hiw-grid">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              className="hiw-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div className="hiw-number">{String(i + 1).padStart(2, '0')}</div>
              <div className="hiw-icon" style={{ color: step.color, background: `${step.color}11` }}>
                <Icon size={20} />
              </div>
              <h3 className="hiw-title">{step.title}</h3>
              <p className="hiw-desc">{step.description}</p>
              <div className="hiw-tech" style={{ color: step.color, borderColor: `${step.color}33` }}>
                {step.tech}
              </div>
            </motion.div>
          );
        })}
      </div>

    </section>
  );
}
