import { ImageResponse } from "next/og";

export const runtime = "nodejs";
// OG 이미지는 파라미터가 유한하지 않으니 요청 시 생성 후 캐시
export const revalidate = 604800;

const C = {
  page: "#fafaf8",
  card: "#ffffff",
  ink: "#0b0b0b",
  sub: "#52514e",
  mut: "#898781",
  accent: "#1c5cab",
  accentStrong: "#2a78d6",
  accentSoft: "#e9f1fb",
  hairline: "#e7e5df",
};

// Satori 호환 한글 폰트(Pretendard OTF)를 한 번만 받아 캐시
let FONTS: { name: string; data: ArrayBuffer; weight: 400 | 700 }[] | null = null;
async function loadFonts() {
  if (FONTS) return FONTS;
  const base =
    "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static";
  const [bold, regular] = await Promise.all([
    fetch(`${base}/Pretendard-Bold.otf`).then((r) => r.arrayBuffer()),
    fetch(`${base}/Pretendard-Regular.otf`).then((r) => r.arrayBuffer()),
  ]);
  FONTS = [
    { name: "Pretendard", data: bold, weight: 700 },
    { name: "Pretendard", data: regular, weight: 400 },
  ];
  return FONTS;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "폰덱스").slice(0, 60);
  const kicker = (searchParams.get("kicker") ?? "휴대폰 결정 사전").slice(0, 40);
  const subtitle = (searchParams.get("subtitle") ?? "").slice(0, 90);
  const stats = [1, 2, 3]
    .map((i) => searchParams.get(`s${i}`))
    .filter(Boolean)
    .map((s) => {
      const [label, value] = String(s).split("|");
      return { label: label ?? "", value: value ?? "" };
    });

  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: C.page,
          padding: "68px 72px",
          fontFamily: "Pretendard",
          position: "relative",
        }}
      >
        {/* 좌측 액센트 바 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "14px",
            background: C.accentStrong,
            display: "flex",
          }}
        />

        {/* 헤더: 로고 + 키커 */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: C.accentSoft,
              border: `3px solid ${C.accentStrong}`,
              display: "flex",
            }}
          />
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "30px", fontWeight: 700, color: C.ink }}>
              폰덱스
            </span>
            <span style={{ fontSize: "23px", color: C.sub }}>{kicker}</span>
          </div>
        </div>

        {/* 본문: 제목 + 부제 + 스탯 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: title.length > 26 ? "58px" : "70px",
              fontWeight: 700,
              color: C.ink,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </span>
          {subtitle ? (
            <span
              style={{
                fontSize: "30px",
                color: C.sub,
                marginTop: "22px",
                lineHeight: 1.4,
              }}
            >
              {subtitle}
            </span>
          ) : null}

          {stats.length > 0 ? (
            <div style={{ display: "flex", gap: "16px", marginTop: "42px" }}>
              {stats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: C.card,
                    border: `1px solid ${C.hairline}`,
                    borderRadius: "16px",
                    padding: "18px 24px",
                    minWidth: "200px",
                  }}
                >
                  <span style={{ fontSize: "22px", color: C.mut }}>
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontSize: "38px",
                      fontWeight: 700,
                      color: C.ink,
                      marginTop: "4px",
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* 푸터 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "26px", fontWeight: 700, color: C.accent }}>
            qtree.kr
          </span>
          <span style={{ fontSize: "22px", color: C.mut }}>
            데이터로 고르는 휴대폰
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.map((f) => ({
        name: f.name,
        data: f.data,
        weight: f.weight,
        style: "normal" as const,
      })),
    },
  );
}
