import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPhones, getPhone, type Issue } from "@/lib/phones";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import SourceNote from "@/components/ui/SourceNote";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPhones().map((p) => ({ model: p.slug }));
}

const SEVERITY_META: Record<
  Issue["severity"],
  { label: string; tone: BadgeTone }
> = {
  info: { label: "참고", tone: "neutral" },
  common: { label: "빈발", tone: "warn" },
  critical: { label: "중대", tone: "crit" },
};

const STATUS_META: Record<
  Issue["status"],
  { label: string; tone: BadgeTone }
> = {
  open: { label: "미해결", tone: "serious" },
  patched: { label: "패치로 해결", tone: "good" },
  recall: { label: "리콜", tone: "crit" },
  "free-repair": { label: "무상수리 대상", tone: "good" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ model: string }>;
}): Promise<Metadata> {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) return {};
  return {
    title: `${phone.name} 알려진 문제 ${phone.issues.length}가지와 해결법`,
    description:
      phone.issues.length > 0
        ? `${phone.name}의 알려진 이슈: ${phone.issues.map((i) => i.title).join(", ")}. 증상과 해결 순서를 정리했습니다.`
        : `${phone.name}은 현재까지 수록된 고질 이슈가 없습니다.`,
    alternates: { canonical: `/phones/${model}/issues` },
  };
}

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const faq = phone.issues.map((i) => ({
    q: `${phone.name} ${i.title}, 어떻게 해결하나요?`,
    a: `${i.summary} 해결 순서: ${i.solutions.join(" → ")}`,
  }));

  return (
    <>
      <JsonLd
        data={[
          ...(faq.length > 0 ? [faqJsonLd(faq)] : []),
          breadcrumbJsonLd([
            { name: "기종 목록", path: "/phones" },
            { name: phone.name, path: `/phones/${phone.slug}` },
            { name: "알려진 이슈", path: `/phones/${phone.slug}/issues` },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="issues"
        title={`${phone.name} 알려진 이슈`}
        lede="이 기종에서 반복적으로 보고된 문제와 해결 순서입니다. 구매 전 체크리스트로, 사용 중이라면 증상 대조용으로 쓰세요."
      >
        {phone.issues.length === 0 ? (
          <div className="rounded-xl border border-hairline bg-card p-8 text-center shadow-card">
            <p className="font-semibold">보고된 고질 이슈가 없습니다</p>
            <p className="mt-1.5 text-sm text-sub">
              출시 후 커뮤니티·뉴스에서 반복 확인된 문제가 아직 없습니다. 새
              이슈가 확인되면 이 문서에 추가됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {phone.issues.map((issue) => {
              const sev = SEVERITY_META[issue.severity];
              const st = STATUS_META[issue.status];
              return (
                <article
                  key={issue.id}
                  className="rounded-xl border border-hairline bg-card p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={sev.tone} dot>
                      {sev.label}
                    </Badge>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <h2 className="mt-2.5 text-lg font-bold tracking-tight">
                    {issue.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    {issue.summary}
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-wash p-3.5">
                      <h3 className="text-xs font-semibold text-mut">
                        이런 증상이라면
                      </h3>
                      <ul className="mt-2 space-y-1.5 text-sm leading-5 text-ink">
                        {issue.symptoms.map((s) => (
                          <li key={s} className="flex gap-2">
                            <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-sub" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-accent-soft/50 p-3.5">
                      <h3 className="text-xs font-semibold text-accent">
                        해결 순서
                      </h3>
                      <ol className="mt-2 space-y-1.5 text-sm leading-5 text-ink">
                        {issue.solutions.map((s, i) => (
                          <li key={s} className="flex gap-2">
                            <span className="tnum shrink-0 font-semibold text-accent">
                              {i + 1}.
                            </span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {issue.source && <SourceNote sources={[issue.source]} />}
                </article>
              );
            })}
          </div>
        )}
      </DocShell>
    </>
  );
}
