import "./OrnamentDivider.css";

type OrnamentDividerProps = {
  className?: string;
  /** Centre motif: diamond, a location pin for the venue, or a paw for the closing. */
  gem?: "diamond" | "pin" | "paw";
};

/**
 * Fine gold hairline divider: two tapering rules meeting at a small centre motif
 * with pearl dots, echoing the gilded arch motif in the programme artwork.
 * Parts are exposed via class names so scroll timelines can draw them in.
 */
export function OrnamentDivider({ className = "", gem = "diamond" }: OrnamentDividerProps) {
  return (
    <span className={`ornament ornament--${gem} ${className}`.trim()} aria-hidden="true">
      <span className="ornament__rule ornament__rule--left" />
      {gem === "pin" ? (
        <svg className="ornament__gem" viewBox="0 0 40 20" focusable="false">
          <circle cx="4" cy="11" r="1.3" />
          <path
            d="M20 16.6C20 16.6 12.4 11.4 12.4 7.6c0-2.2 1.7-3.6 3.7-3.6 1.3 0 2.4.7 3.9 2.3 1.5-1.6 2.6-2.3 3.9-2.3 2 0 3.7 1.4 3.7 3.6 0 3.8-7.6 9-7.6 9Z"
            strokeWidth="1"
          />
          <circle cx="36" cy="11" r="1.3" />
        </svg>
      ) : gem === "paw" ? (
        <svg className="ornament__gem" viewBox="0 0 40 20" focusable="false">
          <circle cx="4" cy="11" r="1.3" />
          <ellipse cx="14.2" cy="6.2" rx="2" ry="2.5" />
          <ellipse cx="20" cy="4.6" rx="2.1" ry="2.6" />
          <ellipse cx="25.8" cy="6.2" rx="2" ry="2.5" />
          <path d="M20 9.2c-3.4 0-5.6 2.4-5.6 4.8 0 1.9 1.5 3.1 3.4 3.1 1 0 1.7-.3 2.2-.9.5.6 1.2.9 2.2.9 1.9 0 3.4-1.2 3.4-3.1 0-2.4-2.2-4.8-5.6-4.8Z" />
          <circle cx="36" cy="11" r="1.3" />
        </svg>
      ) : (
        <svg className="ornament__gem" viewBox="0 0 40 12" focusable="false">
          <circle cx="4" cy="6" r="1.3" />
          <path d="M20 1.2 24.8 6 20 10.8 15.2 6Z" fill="none" strokeWidth="1" />
          <path d="M20 4 22 6 20 8 18 6Z" />
          <circle cx="36" cy="6" r="1.3" />
        </svg>
      )}
      <span className="ornament__rule ornament__rule--right" />
    </span>
  );
}
