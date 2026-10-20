import "./WaxSeal.css";

type WaxSealProps = {
  letters: [string, string];
  label: string;
  onOpen: () => void;
  disabled?: boolean;
};

export function WaxSeal({ letters, label, onOpen, disabled }: WaxSealProps) {
  const monogram = `${letters[0]}${letters[1]}`;

  return (
    <button
      type="button"
      className="wax-seal"
      onClick={onOpen}
      disabled={disabled}
      aria-label={label}
    >
      <svg
        className="wax-seal__svg"
        viewBox="0 0 200 200"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="goldWax" cx="38%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#f3e2b0" />
            <stop offset="28%" stopColor="#e0c36a" />
            <stop offset="62%" stopColor="#c49a3c" />
            <stop offset="100%" stopColor="#8a641c" />
          </radialGradient>
          <filter id="goldEmboss" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="blur" />
            <feSpecularLighting
              in="blur"
              surfaceScale="4"
              specularConstant="1.05"
              specularExponent="16"
              lightingColor="#fff6d8"
              result="spec"
            >
              <fePointLight x="-30" y="-50" z="70" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite
              in="SourceGraphic"
              in2="specOut"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="0.65"
              k4="0"
            />
          </filter>
        </defs>
        <path
          fill="url(#goldWax)"
          filter="url(#goldEmboss)"
          d="M101 10c16 1 28 9 39 18 12 10 27 11 34 25 6 13 4 27 0 40 8 13 11 27 3 40-7 12-21 17-32 27-11 9-21 23-39 25-18 2-31-8-46-14-14-5-32-3-42-15-10-12-8-29-8-44s-6-31 3-44c8-12 25-15 38-25 12-9 26-34 50-33Z"
        />
        <ellipse cx="94" cy="72" rx="46" ry="24" fill="#fff4cc" opacity="0.22" />
        <ellipse cx="100" cy="102" rx="58" ry="54" fill="none" stroke="#7a5414" strokeOpacity="0.18" strokeWidth="2.2" />
        <text x="100" y="122" textAnchor="middle" className="wax-seal__mono">
          {monogram}
        </text>
      </svg>
    </button>
  );
}
