import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { LegalLayout, H2, P, UL, LI } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: `데이터 방법론 — ${SITE_NAME}`,
  description:
    "지원종료일·수리비·중고 시세·이슈를 어디서, 어떻게 수집하고 어떤 신뢰도로 표기하는지 투명하게 공개합니다.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <LegalLayout
      title="데이터 방법론"
      updated="2026-07-07"
      lede="숫자는 근거가 있어야 의미가 있습니다. 각 데이터를 어디서, 어떻게 얻고, 얼마나 믿을 수 있는지 공개합니다."
    >
      <H2>공통 원칙</H2>
      <UL>
        <LI>모든 수치에 출처(source)와 기준일(asOf)을 표기합니다.</LI>
        <LI>
          확인되지 않은 값은 지어내지 않습니다. 정책 기반 계산치는 "추정",
          출처가 약한 값은 신뢰도를 함께 밝힙니다.
        </LI>
        <LI>
          데이터는 기종당 하나의 파일로 관리되며, 형식 검증을 통과하지 못하면
          사이트가 빌드되지 않습니다.
        </LI>
      </UL>

      <H2>지원 종료일 (업데이트)</H2>
      <UL>
        <LI>
          삼성: 공식 지원 정책(예: 갤럭시 S24 이후 OS 7회 + 보안 7년)과{" "}
          <a
            href="https://security.samsungmobile.com/workScope.smsb"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            삼성 모바일 보안 업데이트
          </a>{" "}
          목록, endoflife.date를 교차 확인합니다.
        </LI>
        <LI>
          애플: 공식 종료일을 발표하지 않으므로, 역대 지원 기간(메이저 iOS
          6~7년 + 보안 패치)을 근거로 <strong className="font-semibold text-ink">추정</strong>하며
          "추정" 배지를 표기합니다.
        </LI>
        <LI>자동 갱신: 주 1회 (endoflife.date API).</LI>
      </UL>

      <H2>공식 수리비</H2>
      <UL>
        <LI>
          삼성전자서비스 고지가(파손 부품 반납 기준)와 Apple 공식/공인 서비스
          제공업체 가격표(보증 외·VAT 포함)를 기준으로 합니다.
        </LI>
        <LI>
          케어 자기부담금은 정책상 정률·정액을 반영한 산출치이며, 실제 청구액은
          수리 방식·부품 재고에 따라 달라질 수 있습니다.
        </LI>
        <LI>분기 단위로 검증합니다. 부품 단종 기종은 그 사실을 표기합니다.</LI>
      </UL>

      <H2>중고 시세 · 잔존가치</H2>
      <UL>
        <LI>
          상태 A급 개인거래 시세를 기준으로, 번개장터 매물(전문판매자 제외)의
          중앙값을 이상치 제거 후 산정합니다. 세티즌 실거래가로 교차 확인합니다.
        </LI>
        <LI>
          매월 1포인트씩 기록해 시계열을 만듭니다. 오래된 시세는 신뢰를
          떨어뜨리므로 매월 자동 갱신합니다.
        </LI>
        <LI>
          잔존가치 = 현 시세 ÷ 출시가. 총소유비용·판매 타이밍의 미래
          프로젝션은 감가를 선형 외삽한 <strong className="font-semibold text-ink">추정치</strong>
          이며(월 2.5% 상한·출시가 7% 하한), 신형 발표 등 이벤트로 실제와 달라질
          수 있습니다.
        </LI>
      </UL>

      <H2>알려진 이슈</H2>
      <UL>
        <LI>
          뉴스·제조사 공지로 확인된 사안만 수록합니다. 커뮤니티 단독 루머는
          제외합니다.
        </LI>
        <LI>
          각 이슈에 심각도(참고/빈발/중대)와 상태(미해결/패치됨/리콜/무상수리)를
          표기하고 출처를 링크합니다.
        </LI>
      </UL>

      <H2>이미지</H2>
      <P>
        기종 사진은 Wikimedia Commons의 자유 라이선스 이미지를 사용하며, 각
        기종 페이지 하단에 저작자와 라이선스를 표기합니다. 자유 라이선스 사진이
        없는 기종은 자체 일러스트로 대체합니다.
      </P>

      <H2>한계와 면책</H2>
      <UL>
        <LI>
          모든 데이터는 참고용입니다. 가격·지원 기간은 기준일 이후 변동될 수
          있으니 구매·수리 전 반드시 원 출처를 확인하세요.
        </LI>
        <LI>
          본 사이트의 판정·점수·프로젝션은 공개 데이터의 재조합이며, 특정
          구매·투자를 권유하지 않습니다. 최종 결정과 책임은 이용자에게 있습니다.
        </LI>
        <LI>
          오류를 발견하면{" "}
          <Link href="/contact" className="font-medium text-accent hover:underline">
            문의
          </Link>
          로 알려주세요. 확인 후 갱신합니다.
        </LI>
      </UL>
    </LegalLayout>
  );
}
