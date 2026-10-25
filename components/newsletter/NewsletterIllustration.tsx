import type { CSSProperties } from "react";

const floatDelay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

/** Decorative newsletter scene: an envelope with a SUGNL issue and floating topic bubbles. */
export default function NewsletterIllustration({ className = "" }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 520 460" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <radialGradient id="nl-glow" cx="50%" cy="58%" r="50%">
          <stop offset="0%" stopColor="#2f5bff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2f5bff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nl-envelope" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d6ff7" />
          <stop offset="100%" stopColor="#1a35a8" />
        </linearGradient>
        <linearGradient id="nl-pocket" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3466f0" />
          <stop offset="100%" stopColor="#1b36a3" />
        </linearGradient>
        <linearGradient id="nl-bubble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b63ea" />
          <stop offset="100%" stopColor="#1c2f94" />
        </linearGradient>
        <linearGradient id="nl-bubble-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6d4ff2" />
          <stop offset="100%" stopColor="#3a2aae" />
        </linearGradient>
        <linearGradient id="nl-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a7bff" />
          <stop offset="100%" stopColor="#1846c9" />
        </linearGradient>
      </defs>

      <rect width="520" height="460" fill="url(#nl-glow)" />

      {/* Dashed trails and paper plane */}
      <g fill="none" stroke="#4d7dff" strokeWidth="2" strokeDasharray="6 8" strokeLinecap="round" opacity="0.8">
        <path d="M340 150 C 385 95, 425 90, 452 74" />
        <path d="M120 150 C 108 200, 135 240, 172 262" />
        <path d="M395 230 C 425 245, 440 262, 448 282" />
      </g>
      <g className="newsletter-float" style={floatDelay(1.5)}>
        <path d="M444 72 L505 40 L480 98 L468 80 Z" fill="#3d7bff" />
        <path d="M468 80 L505 40 L472 92 Z" fill="#2a5fd9" />
      </g>

      {/* Envelope back */}
      <path d="M110 250 L260 158 L410 250 L410 400 Q410 415 395 415 L125 415 Q110 415 110 400 Z" fill="url(#nl-envelope)" />

      {/* Newsletter issue */}
      <g transform="rotate(-5 265 225)">
        <rect x="165" y="108" width="200" height="236" rx="16" fill="#f4f7ff" />
        <text x="185" y="152" fontSize="30" fontWeight="800" fill="#10183a" style={{ fontFamily: "var(--font-heading)" }}>
          SUG<tspan fill="#2f6bff">NL</tspan>
        </text>
        <rect x="185" y="168" width="150" height="8" rx="4" fill="#c7d3f6" />
        <rect x="185" y="184" width="108" height="8" rx="4" fill="#c7d3f6" />
        <rect x="185" y="204" width="160" height="112" rx="10" fill="#0f1a3f" />
        <rect x="223" y="217" width="84" height="42" rx="5" fill="url(#nl-screen)" />
        <text x="265" y="242" fontSize="9" fontWeight="700" fill="#ffffff" textAnchor="middle" letterSpacing="1">
          SITECORE
        </text>
        <g fill="#2b3a6b">
          {[198, 214, 230, 246, 262, 278, 294, 310, 326].map((cx) => (
            <circle key={`a${cx}`} cx={cx} cy="284" r="6" />
          ))}
          {[206, 222, 238, 254, 270, 286, 302, 318].map((cx) => (
            <circle key={`b${cx}`} cx={cx} cy="298" r="6.5" />
          ))}
        </g>
      </g>

      {/* Envelope pocket in front of the issue */}
      <path
        d="M110 262 L248 346 Q260 353 272 346 L410 262 L410 400 Q410 415 395 415 L125 415 Q110 415 110 400 Z"
        fill="url(#nl-pocket)"
        stroke="#ffffff"
        strokeOpacity="0.12"
      />
      <path d="M110 400 L230 330 M410 400 L290 330" stroke="#0f2580" strokeOpacity="0.35" strokeWidth="2" />

      {/* Floating topic bubbles */}
      <g className="newsletter-float">
        <rect x="72" y="66" width="76" height="76" rx="18" fill="url(#nl-bubble)" />
        <g transform="translate(92 86) scale(1.5)" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
          <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
        </g>
      </g>
      <g className="newsletter-float" style={floatDelay(2.5)}>
        <rect x="34" y="196" width="92" height="64" rx="14" fill="#1e2a4f" stroke="#3a4c86" />
        <g stroke="#c7d3f6" strokeWidth="5" strokeLinecap="round" opacity="0.8">
          <path d="M52 216h56M52 230h48M52 244h34" />
        </g>
      </g>
      <g className="newsletter-float" style={floatDelay(1)}>
        <rect x="84" y="286" width="70" height="70" rx="17" fill="url(#nl-bubble-purple)" />
        <g transform="translate(101 303) scale(1.5)" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
        </g>
      </g>
      <g className="newsletter-float" style={floatDelay(3.5)}>
        <rect x="418" y="282" width="70" height="70" rx="17" fill="url(#nl-bubble)" />
        <g transform="translate(435 299) scale(1.5)" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 8-4 4 4 4M15 8l4 4-4 4M13.5 5l-3 14" />
        </g>
      </g>
    </svg>
  );
}
