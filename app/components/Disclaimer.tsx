'use client';

import { motion } from 'framer-motion';

export default function Disclaimer() {
  return (
    <section className="disclaimer-section section section-gap">
      <motion.div
        className="disclaimer-container"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="disclaimer-title">Disclaimer</h3>
        <p className="disclaimer-text">
          Agentic Quant Wars is a research and demonstration experiment intended to showcase
          LI.FI&apos;s execution infrastructure in an autonomous trading environment. The activities
          shown are for informational purposes only and do not constitute financial advice,
          investment recommendations, or a solicitation to buy or sell any assets. AI agents operate
          independently, and any referenced tokens or networks should not be interpreted as
          endorsements.
        </p>
      </motion.div>
    </section>
  );
}
