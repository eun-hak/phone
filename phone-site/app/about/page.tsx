import type { Metadata } from "next";
import Link from "next/link";
import { getAllPhones } from "@/lib/phones";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { LegalLayout, H2, P, UL, LI } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: `소개 — ${SITE_NAME}`,
  description: `${SITE_NAME}는 어떤 사이트이고, 데이터를 어떻게 다루는지 소개합니다.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const count = getAllPhones().length;
  return (
    <LegalLayout
      title={`${SITE_NAME} 소개`}
      lede={`${SITE_NAME}(${SITE_TAGLINE})는 "이 폰, 사도 될까?"라는 한 가지 질문에 데이터로 답하는 사이트입니다.`}
    >
      <P>
        휴대폰 정보는 넘치지만, 정작 살지 말지·바꿀지 말지를 결정할 때 필요한
        정보는 흩어져 있습니다. 스펙표는 어디에나 있어도, 이 기종이 몇 년 더
        보안 업데이트를 받는지, 액정이 깨지면 얼마가 드는지, 3년 뒤 중고로 팔면
        얼마가 남는지는 한 곳에 모여 있지 않습니다. {SITE_NAME}는 바로 그
        <strong className="font-semibold text-ink"> 결정에 필요한 데이터</strong>
        만 기종별로 같은 구조로 정리합니다.
      </P>

      <H2>무엇을 다루나</H2>
      <P>
        현재 {count}개 기종을, 각각 동일한 문서 세트로 정리합니다: 업데이트
        종료일, 공식 수리비, 알려진 이슈, 구매 루트, 잔존가치(중고 시세), 총소유
        비용(TCO), 케어 가입 유불리, 판매 타이밍. 여기에 추천 마법사·적정가
        판독기·결정 랭킹 같은 도구를 더했습니다.
      </P>

      <H2>무엇을 다루지 않나</H2>
      <UL>
        <LI>
          상세 스펙 나열·벤치마크 — 이미 잘하는 곳이 많아 원 출처로 안내합니다.
        </LI>
        <LI>
          광고성 "역대급" 리뷰 — 감상이 아니라 숫자로만 이야기합니다.
        </LI>
        <LI>
          실시간 최저가 — 시세 "감각"과 판단 기준을 제공하고, 구매는 각
          판매처로 연결합니다.
        </LI>
      </UL>

      <H2>데이터를 다루는 원칙</H2>
      <UL>
        <LI>
          모든 수치에 <strong className="font-semibold text-ink">출처와 기준일</strong>
          을 표기합니다.
        </LI>
        <LI>
          확인되지 않은 값은 지어내지 않고 "추정" 또는 공란으로 둡니다.
        </LI>
        <LI>
          데이터 수집·산정 방식은{" "}
          <Link href="/methodology" className="font-medium text-accent hover:underline">
            데이터 방법론
          </Link>{" "}
          페이지에 투명하게 공개합니다.
        </LI>
      </UL>

      <H2>누가 만드나 — 폰덱스 편집팀</H2>
      <P>
        폰덱스의 모든 글과 데이터는{" "}
        <strong className="font-semibold text-ink">폰덱스 편집팀</strong>이라는
        이름으로 작성·검수합니다. 편집팀은 제조사(삼성·애플)와 통신사의 공식
        자료, 그리고 번개장터·중고나라·민팃 등 실제 중고 거래 시세를 직접 수집해
        교차검증하는 것을 원칙으로 합니다.
      </P>

      <H2>편집 기준</H2>
      <UL>
        <LI>리포트는 발행 전 데이터의 출처와 계산 근거를 다시 확인합니다.</LI>
        <LI>
          시세·수리비처럼 변하는 값은 정기적으로 갱신하고 기준일을 함께
          표기합니다.
        </LI>
        <LI>
          초안 작성에 AI를 활용하더라도 사실관계는 사람이 검증하며, 확인되지
          않은 값은 싣지 않습니다.
        </LI>
        <LI>
          제휴 링크 여부가 기종 평가·추천에 영향을 주지 않도록 분리해
          운영합니다.
        </LI>
      </UL>

      <H2>운영</H2>
      <P>
        {SITE_NAME}는 개인이 운영하는 독립 사이트입니다. 특정 제조사·통신사와
        제휴 관계가 없으며, 일부 구매 링크는 제휴 링크로 수수료가 발생할 수
        있습니다(구매자 부담 없음). 자세한 내용은{" "}
        <Link href="/privacy" className="font-medium text-accent hover:underline">
          개인정보처리방침
        </Link>
        을 참고하세요. 데이터 오류 제보와 제안은 언제나 환영합니다 —{" "}
        <Link href="/contact" className="font-medium text-accent hover:underline">
          문의
        </Link>
        로 알려주세요.
      </P>
    </LegalLayout>
  );
}
