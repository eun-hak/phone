import type { Metadata } from "next";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";
import { LegalLayout, H2, P, UL, LI } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: `문의 — ${SITE_NAME}`,
  description: `${SITE_NAME}에 데이터 오류 제보·제안·제휴 문의를 보내는 방법입니다.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalLayout
      title="문의"
      lede="데이터 오류 제보, 기능 제안, 제휴·광고 문의를 받습니다."
    >
      <H2>이메일</H2>
      <P>
        아래 주소로 연락 주세요. 보통 며칠 내에 답장드립니다.
      </P>
      <p className="text-[15px]">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-semibold text-accent hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
      </p>

      <H2>이런 제보가 특히 도움이 됩니다</H2>
      <UL>
        <LI>
          수리비·시세·지원종료일이 실제와 다른 경우 — 가능하면 확인한 출처
          링크와 기준일을 함께 알려주세요.
        </LI>
        <LI>추가되었으면 하는 기종.</LI>
        <LI>기종별로 잘못 표기된 이슈·해결법.</LI>
      </UL>

      <H2>고지</H2>
      <P>
        {SITE_NAME}는 기술 지원 창구가 아닙니다. 개별 기기의 고장·수리는 제조사
        공식 서비스센터로 문의하세요. 본 사이트의 정보는 참고용이며 구매·수리
        결정의 최종 책임은 이용자에게 있습니다.
      </P>
    </LegalLayout>
  );
}
