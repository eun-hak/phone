import type { Metadata } from "next";
import Link from "next/link";
import { getAllPhones } from "@/lib/phones";
import { formatKRW, formatManwon, formatPct } from "@/lib/format";
import { itemListJsonLd } from "@/lib/jsonld";
import Badge from "@/components/ui/Badge";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "휴대폰 수리비 비교표 — 기종별 화면·배터리 공식가",
  description:
    "갤럭시·아이폰 기종별 공식 수리비(화면·배터리·후면 유리)를 한 표로 비교합니다. 수리비 부담률로 수리할지 교체할지 판단하세요.",
  alternates: { canonical: "/repair-cost" },
};

export default function RepairCostPage() {
  const phones = [...getAllPhones()].sort(
    (a, b) => (b.metrics.repairBurdenPct ?? 0) - (a.metrics.repairBurdenPct ?? 0),
  );

  const cost = (slug: string, part: string) => {
    const p = phones.find((x) => x.slug === slug);
    const r = p?.repairCosts.find((x) => x.part === part);
    return r ? formatKRW(r.officialKRW) : "—";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={itemListJsonLd(
          "휴대폰 수리비 비교",
          phones.map((p) => ({
            name: p.name,
            path: `/phones/${p.slug}/repair`,
          })),
        )}
      />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        수리비 비교표
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        제조사 공식 서비스 기준 부품별 수리비입니다.{" "}
        <strong className="font-semibold text-ink">부담률</strong>은 화면
        수리비를 현 중고 시세로 나눈 값 — 60%를 넘으면 보험 없이는 수리보다
        기기 교체가 나을 수 있는 구간입니다. 부담률이 높은 순으로 정렬했습니다.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-hairline bg-card shadow-card">
        <table className="data-table min-w-[720px]">
          <thead>
            <tr>
              <th>기종</th>
              <th className="text-right">화면</th>
              <th className="text-right">배터리</th>
              <th className="text-right">후면 유리</th>
              <th className="text-right">현 중고 시세</th>
              <th className="text-right">부담률</th>
            </tr>
          </thead>
          <tbody>
            {phones.map((p) => {
              const burden = p.metrics.repairBurdenPct;
              return (
                <tr key={p.slug}>
                  <td>
                    <Link
                      href={`/phones/${p.slug}/repair`}
                      className="font-medium hover:text-accent"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="tnum text-right">{cost(p.slug, "display")}</td>
                  <td className="tnum text-right">{cost(p.slug, "battery")}</td>
                  <td className="tnum text-right">
                    {cost(p.slug, "back-glass")}
                  </td>
                  <td className="tnum text-right text-sub">
                    {formatManwon(p.metrics.latestResale)}
                  </td>
                  <td className="text-right">
                    {burden !== null ? (
                      <Badge
                        tone={
                          burden >= 60 ? "serious" : burden >= 40 ? "warn" : "good"
                        }
                        dot
                      >
                        {formatPct(burden, 0)}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-5 text-mut">
        출처: 삼성전자서비스 고지가 집계 (기준일 2026-02, 파손 부품 반납 기준
        — 미반납 시 더 비쌉니다) · Apple 공식 수리 비용 (기준일 2026-07-02,
        보증 외·VAT 포함 — 공인 서비스 제공업체는 자체 요금으로 더 높을 수
        있습니다). 보험(삼성 케어플러스·AppleCare+) 가입 시 자기부담금은 각
        기종의 수리비 문서에서 확인하세요.
      </p>
    </div>
  );
}
