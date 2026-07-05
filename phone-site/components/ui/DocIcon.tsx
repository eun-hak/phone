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
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.2 9.8c0-1.1 1.2-1.8 2.8-1.8s2.8.7 2.8 1.8c0 2.7-5.6 1.7-5.6 4.4 0 1.1 1.2 1.8 2.8 1.8s2.8-.7 2.8-1.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.8v5.4c0 4.5-3 8.2-7 9.8-4-1.6-7-5.3-7-9.8V5.8L12 3z" />
      <path d="M9 11.8l2 2 4-4.3" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 11.5V4.8c0-.7.6-1.3 1.3-1.3h6.7c.4 0 .7.1 1 .4l8 8c.5.5.5 1.3 0 1.8l-6.6 6.6c-.5.5-1.3.5-1.8 0l-8-8a1.4 1.4 0 0 1-.4-1z" />
      <circle cx="8.2" cy="8.2" r="1.4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.5 8.5l-2.2 5-5 2.2 2.2-5 5-2.2z" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20.2c1.3-3.3 4-5 7.2-5s5.9 1.7 7.2 5" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5.5H4.5a3 3 0 0 0 3 4M17 5.5h2.5a3 3 0 0 1-3 4" />
      <path d="M12 14v3.5M8.5 20.5h7M9.5 17.5h5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5l9 4.5-9 4.5-9-4.5 9-4.5z" />
      <path d="M3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
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
