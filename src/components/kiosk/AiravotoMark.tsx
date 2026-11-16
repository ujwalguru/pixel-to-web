type Props = { className?: string };

/** Airavoto "A" mark traced from the brand logo; uses currentColor. */
export function AiravotoMark({ className }: Props) {
  return (
    <svg viewBox="220 170 830 810" className={className} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M641 185 L910 673 L237 916 Z M640 458 L509 702 L721 604 Z"
      />
      <path d="M686 795 L893 727 L1027 965 L830 905 Z" />
    </svg>
  );
}
