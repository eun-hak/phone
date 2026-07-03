import Link from "next/link";
import { NAV_ITEMS, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-hairline bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-base font-bold">{SITE_NAME}</p>
            <p className="mt-1 text-sm text-sub">{SITE_TAGLINE}</p>
            <p className="mt-3 max-w-xs text-xs leading-5 text-mut">
              기종별 업데이트 종료일·공식 수리비·알려진 이슈·구매 루트·중고
              잔존가치를 한 곳에 정리합니다. 모든 데이터에 기준일과 출처를
              표기합니다.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-sub">바로가기</p>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sub transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-sub">고지</p>
            <p className="mt-3 text-xs leading-5 text-mut">
              가격·지원 기간 정보는 각 출처의 공개 자료를 정리한 것으로, 기준일
              이후 변동될 수 있습니다. 구매 결정 전 반드시 원 출처를
              확인하세요.
            </p>
            <p className="mt-2 text-xs leading-5 text-mut">
              일부 외부 링크는 제휴 링크로, 구매 시 사이트에 수수료가 지급될 수
              있습니다. 수수료는 데이터 갱신 비용에 사용됩니다.
            </p>
          </div>
        </div>
        <p className="mt-10 border-t border-hairline pt-6 text-xs text-mut">
          © 2026 {SITE_NAME}. 데이터 오류 제보를 환영합니다.
        </p>
      </div>
    </footer>
  );
}
