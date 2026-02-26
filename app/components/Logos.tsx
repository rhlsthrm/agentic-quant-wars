interface LogoProps {
  size?: number;
  className?: string;
}

export function LifiLogo({ size = 24, className = '' }: LogoProps) {
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

export function PhantomLogo({ size = 24, className = '' }: LogoProps) {
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

export function OpenAILogo({ size = 32, className = '' }: LogoProps) {
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

export function ClaudeLogo({ size = 32, className = '' }: LogoProps) {
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

export function GeminiLogo({ size = 32, className = '' }: LogoProps) {
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

export function GrokLogo({ size = 32, className = '' }: LogoProps) {
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

export function GLMLogo({ size = 32, className = '' }: LogoProps) {
  return (
    <img
      src="/logos/glm.png"
      alt="GLM-5"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', objectFit: 'contain' }}
    />
  );
}

export const AGENT_LOGOS: Record<string, React.ComponentType<LogoProps>> = {
  gpt: OpenAILogo,
  claude: ClaudeLogo,
  gemini: GeminiLogo,
  grok: GrokLogo,
  glm: GLMLogo,
};
