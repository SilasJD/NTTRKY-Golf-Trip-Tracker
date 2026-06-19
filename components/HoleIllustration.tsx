type Props = {
  par: number;
  holeNumber: number;
  className?: string;
};

export function HoleIllustration({ par, holeNumber, className = "" }: Props) {
  const bendLeft = holeNumber % 2 === 0;
  const fairwayPath = bendLeft
    ? "M100,280 C100,220 60,200 60,150 C60,100 110,90 100,30"
    : "M100,280 C100,220 140,200 140,150 C140,100 90,90 100,30";

  return (
    <svg viewBox="0 0 200 300" className={className} aria-hidden="true">
      <rect width="200" height="300" fill="#bbf7d0" opacity="0.3" />
      <path
        d={fairwayPath}
        stroke="#4ade80"
        strokeWidth={par === 3 ? 34 : par === 5 ? 50 : 42}
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="100" cy="30" r="26" fill="#86efac" opacity="0.8" />
      <circle cx={bendLeft ? 60 : 140} cy="150" r="10" fill="#fde68a" opacity="0.7" />
      <rect x="94" y="270" width="12" height="12" rx="2" fill="#15803d" />
      <line x1="100" y1="14" x2="100" y2="34" stroke="#15803d" strokeWidth="2.5" />
      <path d="M100,14 L116,19 L100,24 Z" fill="#dc2626" />
    </svg>
  );
}
