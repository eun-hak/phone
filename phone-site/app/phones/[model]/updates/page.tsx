import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPhones, getPhone, EOL_STATUS_META } from "@/lib/phones";
import {
  formatDday,
  formatKoreanYearMonth,
  formatMonthsAsYears,
  formatYearMonth,
} from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import EolBar from "@/components/phone/EolBar";
import Badge from "@/components/ui/Badge";
import SourceNote from "@/components/ui/SourceNote";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPhones().map((p) => ({ model: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ model: string }>;
}): Promise<Metadata> {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) return {};
  return {
    title: `${phone.name} 언제까지 업데이트? OS·보안지원 종료일`,
    description: `${phone.name}의 OS 업데이트는 ${
      phone.eol.osEndDate ? formatYearMonth(phone.eol.osEndDate) : "미상"
    }, 보안 업데이트는 ${
      phone.eol.securityEndDate
        ? formatYearMonth(phone.eol.securityEndDate)
        : "미상"
    }까지${phone.eol.estimated ? "로 추정" : ""}. ${phone.eol.policy}`,
    alternates: { canonical: `/phones/${model}/updates` },
  };
}

export default async function UpdatesPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const m = phone.metrics;
  const eolMeta = m.eolStatus ? EOL_STATUS_META[m.eolStatus] : null;

  const faq = [
    {
      q: `${phone.name}은 언제까지 업데이트되나요?`,
      a: `OS(메이저) 업데이트는 ${
        phone.eol.osEndDate
          ? formatKoreanYearMonth(phone.eol.osEndDate)
          : "미상"
      }, 보안 업데이트는 ${
        phone.eol.securityEndDate
          ? formatKoreanYearMonth(phone.eol.securityEndDate)
          : "미상"
      }까지${phone.eol.estimated ? "로 추정됩니다" : "입니다"}. 근거: ${phone.eol.policy}`,
    },
    {
      q: "보안 업데이트가 끝나면 폰을 못 쓰나요?",
      a: "기기는 계속 작동하지만, 새로 발견되는 보안 취약점이 더 이상 수리되지 않습니다. 금융앱·간편결제·공동인증서처럼 보안이 중요한 용도로는 사용을 피하고, 서브폰 용도로 전환하는 것을 권장합니다.",
    },
    ...(phone.eol.estimated
      ? [
          {
            q: "종료일이 확정된 날짜인가요?",
            a: "아니요. 애플은 기기별 지원 종료일을 사전에 공표하지 않아, 역대 기종의 실제 지원 기간을 근거로 한 추정치입니다. 실제 종료일은 앞뒤로 달라질 수 있습니다.",
          },
        ]
      : []),
  ];

  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(faq),
          breadcrumbJsonLd([
            { name: "기종 목록", path: "/phones" },
            { name: phone.name, path: `/phones/${phone.slug}` },
            { name: "업데이트 종료", path: `/phones/${phone.slug}/updates` },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="updates"
        title={`${phone.name} 업데이트 종료일`}
        lede="폰의 실질 수명은 배터리가 아니라 보안 업데이트가 결정합니다. 종료일이 지나면 금융앱 사용이 위험해지고 중고가도 급락합니다."
        asOf={phone.eol.source.asOf}
      >
        <section aria-label="지원 종료 요약">
          <div className="overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>종료 시점</th>
                  <th>남은 기간</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">OS(메이저) 업데이트</td>
                  <td className="tnum">
                    {phone.eol.osEndDate
                      ? formatYearMonth(phone.eol.osEndDate)
                      : "미상"}
                    {phone.eol.estimated && (
                      <Badge tone="warn" className="ml-2">
                        추정
                      </Badge>
                    )}
                  </td>
                  <td className="tnum text-sub">
                    {phone.eol.osEndDate ? formatDday(phone.eol.osEndDate) : "—"}
                  </td>
                  <td className="text-xs text-mut">새 기능 업데이트 기준</td>
                </tr>
                <tr>
                  <td className="font-medium">보안 업데이트</td>
                  <td className="tnum">
                    {phone.eol.securityEndDate
                      ? formatYearMonth(phone.eol.securityEndDate)
                      : "미상"}
                    {phone.eol.estimated && (
                      <Badge tone="warn" className="ml-2">
                        추정
                      </Badge>
                    )}
                  </td>
                  <td className="tnum text-sub">
                    {phone.eol.securityEndDate
                      ? formatDday(phone.eol.securityEndDate)
                      : "—"}
                  </td>
                  <td>
                    {eolMeta && (
                      <Badge tone={eolMeta.tone} dot>
                        {eolMeta.label}
                      </Badge>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <SourceNote sources={[phone.eol.source]} extra={phone.eol.policy} />
        </section>

        {phone.eol.securityEndDate && m.supportElapsedPct !== null && (
          <section aria-label="수명 진행">
            <h2 className="text-lg font-bold tracking-tight">
              지원 수명, 어디까지 왔나
            </h2>
            <div className="mt-4 rounded-xl border border-hairline bg-card p-5 shadow-card">
              <EolBar
                releaseDate={phone.releaseDate}
                securityEndDate={phone.eol.securityEndDate}
                elapsedPct={m.supportElapsedPct}
              />
              {m.monthsLeftSecurity !== null && m.monthsLeftSecurity > 0 && (
                <p className="mt-4 text-sm leading-6 text-sub">
                  지금 구매하면{" "}
                  <strong className="font-semibold text-ink">
                    {formatMonthsAsYears(m.monthsLeftSecurity)}
                  </strong>{" "}
                  동안 보안 업데이트를 받으며 쓸 수 있습니다.
                  {m.monthsLeftSecurity < 24 &&
                    " 2년 이상 사용할 계획이라면 지원 기간이 더 긴 기종을 권합니다."}
                </p>
              )}
            </div>
          </section>
        )}

        <section aria-label="가이드">
          <h2 className="text-lg font-bold tracking-tight">
            종료일을 왜 봐야 하나
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 text-sub">
            <li className="flex gap-2">
              <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-accent-strong" />
              <span>
                <strong className="font-semibold text-ink">보안</strong> — 종료
                후 발견되는 취약점은 패치되지 않습니다. 금융·결제 앱 사용 기기는
                반드시 지원 기간 내로.
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-accent-strong" />
              <span>
                <strong className="font-semibold text-ink">중고가</strong> —
                지원 종료가 가까워질수록 감가가 가팔라집니다. 되팔 계획이 있다면
                종료 1년 전이 마지노선입니다.
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-accent-strong" />
              <span>
                <strong className="font-semibold text-ink">앱 호환</strong> —
                OS 업데이트가 끝나면 1~2년 뒤부터 최신 앱 설치가 막히기
                시작합니다.
              </span>
            </li>
          </ul>
        </section>

        <section aria-label="자주 묻는 질문">
          <h2 className="text-lg font-bold tracking-tight">자주 묻는 질문</h2>
          <dl className="mt-4 space-y-4">
            {faq.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-hairline bg-card p-4 shadow-card"
              >
                <dt className="text-sm font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-sm leading-6 text-sub">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </DocShell>
    </>
  );
}
