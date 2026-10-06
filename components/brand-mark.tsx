import { useId } from "react";

export function BrandMark({ className = "" }: { className?: string }) {
  const gradientId = useId();
  const glowId = useId();

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="8"
          y1="5"
          x2="58"
          y2="61"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EEA76E" />
          <stop offset="0.5" stopColor="#D8754D" />
          <stop offset="1" stopColor="#A94430" />
        </linearGradient>
        <radialGradient
          id={glowId}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(17 8) rotate(55) scale(46)"
        >
          <stop stopColor="white" stopOpacity="0.36" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${gradientId})`} />
      <rect width="64" height="64" rx="18" fill={`url(#${glowId})`} />
      <rect
        x="0.75"
        y="0.75"
        width="62.5"
        height="62.5"
        rx="17.25"
        stroke="white"
        strokeOpacity="0.34"
        strokeWidth="1.5"
      />
      <path
        d="M19 21H45L19 43H45"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
