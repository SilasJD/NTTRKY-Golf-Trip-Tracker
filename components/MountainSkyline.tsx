type Props = {
  className?: string;
};

export function MountainSkyline({ className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 400 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0,80 L0,52 L60,30 L110,46 L170,18 L230,44 L290,26 L340,46 L400,34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.25"
      />
      <path
        d="M0,80 L0,64 L50,48 L100,60 L160,38 L210,56 L270,40 L320,58 L400,46"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}
