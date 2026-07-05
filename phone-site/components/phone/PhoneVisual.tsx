/**
 * 기종 일러스트 — slug만으로 폼팩터(슬라브/플립/폴드)와 전면 디자인
 * (펀치홀/노치/다이나믹 아일랜드/홈버튼), 시리즈 컬러를 절차 생성한다.
 * 실사진 대신 쓰는 이유: 89기종 전부 동일 톤 유지 + 저작권·핫링크 무風險 + 0KB 로딩.
 * 서버/클라이언트 어디서든 렌더 가능 (훅 미사용).
 */

type FormFactor = "slab" | "flip" | "fold";
type Front = "punch" | "notch" | "island" | "home";

function formFactorOf(slug: string): FormFactor {
  if (slug.includes("flip")) return "flip";
  if (slug.includes("fold")) return "fold";
  return "slab";
}

function frontOf(slug: string): Front {
  if (slug.startsWith("galaxy")) return "punch";
  if (slug.includes("se-")) return "home";
  if (
    /^iphone-(x|xs|xr|11|12|13)($|-)/.test(slug) ||
    slug === "iphone-14" ||
    slug === "iphone-14-plus"
  )
    return "notch";
  return "island"; // 14 Pro 이후, 15~17, Air
}

/** 시리즈별 바디 그라데이션 [밝은, 어두운] */
function colorsOf(slug: string): [string, string] {
  if (slug.startsWith("galaxy-z")) return ["#8d7fd6", "#5a4a9e"]; // 폴더블 바이올렛
  if (slug.startsWith("galaxy-note")) return ["#a8906e", "#70583c"]; // 노트 브론즈
  if (slug.startsWith("galaxy-a") || slug.startsWith("galaxy-quantum"))
    return ["#7db4e0", "#4a7fb8"]; // A 라이트블루
  if (slug.startsWith("galaxy")) {
    // S — 울트라는 더 어둡게
    return slug.includes("ultra") ? ["#5a6472", "#2e3640"] : ["#8494a8", "#54637a"];
  }
  if (slug === "iphone-air") return ["#d5d8dd", "#9fa4ad"]; // 에어 실버
  if (slug.includes("se-")) return ["#4a4a4e", "#232326"]; // SE 블랙
  if (slug.includes("pro")) return ["#8e9096", "#4c4e54"]; // 프로 티타늄
  return ["#6ba3e4", "#3b6cbe"]; // 아이폰 기본 블루
}

export default function PhoneVisual({
  slug,
  className = "h-14 w-auto",
  title,
}: {
  slug: string;
  className?: string;
  title?: string;
}) {
  const ff = formFactorOf(slug);
  const front = frontOf(slug);
  const [c1, c2] = colorsOf(slug);
  const gid = `pv-${slug}`;

  if (ff === "fold") {
    // 펼친 폴드 — 넓은 화면 + 중앙 크리즈 + 우측 펀치홀
    return (
      <svg
        viewBox="0 0 96 120"
        className={className}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        </defs>
        <rect x="4" y="6" width="88" height="108" rx="9" fill={`url(#${gid})`} />
        <rect x="9" y="11" width="78" height="98" rx="5" fill="#10131a" />
        {/* 크리즈 */}
        <line x1="48" y1="12" x2="48" y2="108" stroke="#000" strokeOpacity="0.35" />
        <line x1="48.8" y1="12" x2="48.8" y2="108" stroke="#fff" strokeOpacity="0.06" />
        {/* 화면 반사 */}
        <path d="M9 11h34L15 109H9z" fill="#fff" opacity="0.05" />
        <circle cx="70" cy="19" r="2.2" fill="#2a2f3a" stroke="#000" strokeOpacity="0.4" />
      </svg>
    );
  }

  if (ff === "flip") {
    // 펼친 플립 — 가로 힌지 라인 + 펀치홀
    return (
      <svg
        viewBox="0 0 60 120"
        className={className}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        </defs>
        <rect x="4" y="3" width="52" height="114" rx="9" fill={`url(#${gid})`} />
        <rect x="8" y="7" width="44" height="106" rx="5" fill="#10131a" />
        {/* 힌지 */}
        <line x1="8" y1="60" x2="52" y2="60" stroke="#000" strokeOpacity="0.35" />
        <line x1="8" y1="60.8" x2="52" y2="60.8" stroke="#fff" strokeOpacity="0.06" />
        <path d="M8 7h20L12 113H8z" fill="#fff" opacity="0.05" />
        <circle cx="30" cy="14" r="2.2" fill="#2a2f3a" stroke="#000" strokeOpacity="0.4" />
      </svg>
    );
  }

  // 슬라브
  const isHome = front === "home";
  const screenY = isHome ? 14 : 7;
  const screenH = isHome ? 92 : 106;
  return (
    <svg
      viewBox="0 0 60 120"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      {/* 사이드 버튼 */}
      <rect x="56.5" y="34" width="2.5" height="14" rx="1.2" fill={c2} />
      <rect x="1" y="30" width="2.5" height="9" rx="1.2" fill={c2} />
      <rect x="1" y="42" width="2.5" height="9" rx="1.2" fill={c2} />
      <rect x="4" y="3" width="52" height="114" rx="10" fill={`url(#${gid})`} />
      <rect x="8" y={screenY} width="44" height={screenH} rx="5" fill="#10131a" />
      <path
        d={`M8 ${screenY}h20L12 ${screenY + screenH}H8z`}
        fill="#fff"
        opacity="0.05"
      />
      {front === "punch" && (
        <circle cx="30" cy="14" r="2.2" fill="#2a2f3a" stroke="#000" strokeOpacity="0.4" />
      )}
      {front === "notch" && (
        <path
          d="M20 7h20v3.5a3.5 3.5 0 0 1-3.5 3.5h-13A3.5 3.5 0 0 1 20 10.5z"
          fill={`url(#${gid})`}
        />
      )}
      {front === "island" && (
        <rect x="22" y="11" width="16" height="5" rx="2.5" fill="#000" stroke="#2a2f3a" strokeWidth="0.5" />
      )}
      {front === "home" && (
        <circle cx="30" cy="111" r="4" fill="none" stroke="#3a3d44" strokeWidth="1.5" />
      )}
    </svg>
  );
}
