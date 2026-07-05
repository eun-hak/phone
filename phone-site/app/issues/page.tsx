import type { Metadata } from "next";
import Link from "next/link";
import { getAllPhones, type PhoneWithMetrics, type Issue } from "@/lib/phones";
import { itemListJsonLd } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";
import Badge from "@/components/ui/Badge";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "이슈 센터 — 전 기종 결함·리콜·무상수리 현황",
  description:
    "수록 전 기종의 알려진 결함을 한 곳에서 봅니다. 미해결 중대 이슈, 리콜·무상수리 대상, 업데이트로 해결된 이슈를 상태별로 정리했습니다.",
  alternates: { canonical: "/issues" },
};

interface FlatIssue {
  phone: PhoneWithMetrics;
  issue: Issue;
}

const SEVERITY_META: Record<
  Issue["severity"],
  { label: string; tone: "crit" | "warn" | "neutral" }
> = {
  critical: { label: "중대", tone: "crit" },
  common: { label: "빈발", tone: "warn" },
  info: { label: "참고", tone: "neutral" },
};

const STATUS_META: Record<
  Issue["status"],
  { label: string; tone: "crit" | "serious" | "good" | "accent" }
> = {
  open: { label: "미해결", tone: "crit" },
  recall: { label: "리콜", tone: "serious" },
  "free-repair": { label: "무상수리", tone: "accent" },
  patched: { label: "해결됨", tone: "good" },
};

function IssueRow({ phone, issue }: FlatIssue) {
  const sev = SEVERITY_META[issue.severity];
  const st = STATUS_META[issue.status];
  return (
    <li className="rounded-xl border border-hairline bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={sev.tone} dot>
          {sev.label}
        </Badge>
        <Badge tone={st.tone}>{st.label}</Badge>
        <Link
          href={`/phones/${phone.slug}/issues`}
          className="text-xs font-medium text-accent hover:underline"
        >
          {phone.name}
        </Link>
      </div>
      <p className="mt-2 text-sm font-semibold">{issue.title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-sub">
        {issue.summary}
      </p>
    </li>
  );
}

export default function IssuesCenterPage() {
  const phones = getAllPhones();
  const flat: FlatIssue[] = phones.flatMap((phone) =>
    phone.issues.map((issue) => ({ phone, issue })),
  );

  const criticalOpen = flat.filter(
    (f) => f.issue.severity === "critical" && f.issue.status === "open",
  );
  const covered = flat.filter(
    (f) => f.issue.status === "recall" || f.issue.status === "free-repair",
  );
  const commonOpen = flat.filter(
    (f) => f.issue.severity !== "critical" && f.issue.status === "open",
  );
  const patched = flat.filter((f) => f.issue.status === "patched");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd
        data={itemListJsonLd(
          "이슈 센터",
          criticalOpen
            .slice(0, 20)
            .map((f) => ({
              name: `${f.phone.name} — ${f.issue.title}`,
              path: `/phones/${f.phone.slug}/issues`,
            })),
        )}
      />
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        이슈 센터
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
        수록 전 기종({phones.length}개)의 알려진 결함 {flat.length}건을 상태별로
        모았습니다. 폰덱스는 커뮤니티 루머가 아니라{" "}
        <strong className="font-semibold text-ink">
          출처가 확인된 반복 보고 이슈만
        </strong>{" "}
        게재합니다.
      </p>

      {/* 요약 스탯 */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "미해결 중대", value: criticalOpen.length, tone: "text-crit" },
          { label: "리콜·무상수리", value: covered.length, tone: "text-serious" },
          { label: "미해결 일반", value: commonOpen.length, tone: "text-warn" },
          { label: "해결됨", value: patched.length, tone: "text-good-deep" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-hairline bg-card p-4 shadow-card"
          >
            <p className="text-xs font-medium text-mut">{s.label}</p>
            <p className={`tnum mt-1 text-2xl font-bold ${s.tone}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* 미해결 중대 */}
      <section aria-labelledby="critical-open" className="mt-10">
        <h2 id="critical-open" className="text-xl font-bold tracking-tight">
          🚨 미해결 중대 이슈
        </h2>
        <p className="mt-1 text-sm text-sub">
          구매 전 반드시 확인해야 하는, 아직 해결책이 없는 하드웨어성 결함
          보고입니다.
        </p>
        {criticalOpen.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {criticalOpen.map((f) => (
              <IssueRow key={`${f.phone.slug}-${f.issue.id}`} {...f} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-hairline bg-card p-5 text-sm text-sub shadow-card">
            현재 미해결 중대 이슈가 없습니다.
          </p>
        )}
      </section>

      {/* 리콜/무상수리 */}
      <section aria-labelledby="covered" className="mt-10">
        <h2 id="covered" className="text-xl font-bold tracking-tight">
          리콜 · 무상수리 대상
        </h2>
        <p className="mt-1 text-sm text-sub">
          증상이 있다면 비용 없이 조치받을 수 있는 이슈입니다 — 해당 기기
          사용자는 서비스센터에서 대상 여부를 확인하세요.
        </p>
        {covered.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {covered.map((f) => (
              <IssueRow key={`${f.phone.slug}-${f.issue.id}`} {...f} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-hairline bg-card p-5 text-sm text-sub shadow-card">
            현재 진행 중인 리콜·무상수리 이슈가 없습니다.
          </p>
        )}
      </section>

      {/* 일반 미해결 */}
      {commonOpen.length > 0 && (
        <section aria-labelledby="common-open" className="mt-10">
          <h2 id="common-open" className="text-xl font-bold tracking-tight">
            미해결 일반 이슈
          </h2>
          <ul className="mt-4 space-y-3">
            {commonOpen.map((f) => (
              <IssueRow key={`${f.phone.slug}-${f.issue.id}`} {...f} />
            ))}
          </ul>
        </section>
      )}

      {/* 해결됨 — 접힌 요약 */}
      {patched.length > 0 && (
        <section aria-labelledby="patched" className="mt-10">
          <h2 id="patched" className="text-xl font-bold tracking-tight">
            업데이트로 해결된 이슈
          </h2>
          <p className="mt-1 text-sm text-sub">
            최신 소프트웨어에서는 재현되지 않는 이슈입니다. 중고 구매 시 “최신
            업데이트 여부”만 확인하면 됩니다.
          </p>
          <ul className="mt-4 space-y-2">
            {patched.map((f) => (
              <li
                key={`${f.phone.slug}-${f.issue.id}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-card px-4 py-2.5 text-sm shadow-card"
              >
                <Badge tone="good">해결됨</Badge>
                <Link
                  href={`/phones/${f.phone.slug}/issues`}
                  className="font-medium hover:text-accent"
                >
                  {f.phone.name}
                </Link>
                <span className="text-sub">— {f.issue.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-xs leading-5 text-mut">
        게재 기준: 복수 매체 또는 공식 공지로 확인된 반복 보고만 수록하며, 각
        이슈의 출처와 기준일은 기종별 이슈 문서에 표기합니다. 단발성 커뮤니티
        제보는 후보 큐에서 검토 후 게재합니다.
      </p>
    </div>
  );
}
