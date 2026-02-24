// Partner logos + AI Agent logos as image components

// ===== PARTNER LOGOS (using actual image files) =====

export function LifiLogo({ size = 24, className = '' }) {
  return (
    <img
      src="/logos/lifi.svg"
      alt="LI.FI"
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain' }}
    />
  );
}

export function PhantomLogo({ size = 24, className = '' }) {
  return (
    <img
      src="/logos/phantom.png"
      alt="Phantom"
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain' }}
    />
  );
}

// ===== AI AGENT LOGOS (using actual image files) =====

export function OpenAILogo({ size = 32, className = '' }) {
  return (
    <img
      src="/logos/openai.webp"
      alt="ChatGPT"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain', borderRadius: '6px' }}
    />
  );
}

export function ClaudeLogo({ size = 32, className = '' }) {
  return (
    <img
      src="/logos/claude.png"
      alt="Claude"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain', borderRadius: '6px' }}
    />
  );
}

export function GeminiLogo({ size = 32, className = '' }) {
  return (
    <img
      src="/logos/gemini.png"
      alt="Gemini"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain' }}
    />
  );
}

export function GrokLogo({ size = 32, className = '' }) {
  return (
    <img
      src="/logos/grok.webp"
      alt="Grok"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain', borderRadius: '6px' }}
    />
  );
}

export function DeepSeekLogo({ size = 32, className = '' }) {
  return (
    <img
      src="/logos/deepseek.png"
      alt="DeepSeek"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain' }}
    />
  );
}

// Map agent IDs to their logo components
export const AGENT_LOGOS = {
  gpt: OpenAILogo,
  claude: ClaudeLogo,
  gemini: GeminiLogo,
  grok: GrokLogo,
  deepseek: DeepSeekLogo,
};
