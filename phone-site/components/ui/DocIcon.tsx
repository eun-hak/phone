const PATHS: Record<string, React.ReactNode> = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  wrench: (
    <path d="M14.5 6.5a4 4 0 0 0-5.6 4.9L4 16.3a2 2 0 1 0 2.8 2.8l4.9-4.9a4 4 0 0 0 4.9-5.6l-2.6 2.6-2.1-2.1 2.6-2.6z" />
  ),
  alert: (
    <>
      <path d="M12 3.5 21 19H3l9-15.5z" />
      <path d="M12 10v4M12 16.8v.2" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.5l2 11.5h10L20 8H7" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="16.5" cy="19.5" r="1.3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M7 15l4-4 3 2.5L19 8" />
    </>
  ),
};

export default function DocIcon({
  name,
  className = "size-5",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
