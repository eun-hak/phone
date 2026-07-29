import { ImageResponse } from "next/og";

// iOS 홈 화면 아이콘
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2a78d6",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32">
          <rect x="9" y="4" width="14" height="24" rx="4" fill="#ffffff" />
          <path
            d="M12.4 16.2l2.6 2.6 4.7-5.5"
            fill="none"
            stroke="#2a78d6"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
