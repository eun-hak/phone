import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";
import { LegalLayout, H2, P, UL, LI } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: `개인정보처리방침 — ${SITE_NAME}`,
  description: `${SITE_NAME}가 수집하는 정보, 쿠키, 광고(Google AdSense 등) 및 분석 도구, 제3자 제공에 대한 안내입니다.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="개인정보처리방침"
      updated="2026-07-07"
      lede={`${SITE_NAME}(이하 "사이트")는 이용자의 개인정보를 중요하게 생각하며, 아래와 같이 정보를 처리합니다.`}
    >
      <H2>1. 수집하는 정보</H2>
      <P>
        사이트는 회원가입이 없으며, 이름·연락처 등 개인식별정보를 직접 수집하지
        않습니다. 다만 서비스 운영·개선·광고를 위해 아래 정보가 자동으로
        수집되거나 이용자 기기에 저장될 수 있습니다.
      </P>
      <UL>
        <LI>
          접속 로그·기기/브라우저 정보·페이지 이용 기록 (분석 도구를 통해)
        </LI>
        <LI>
          이용자가 브라우저에 직접 저장하는 정보: "내 폰" 대시보드·중고 구매
          체크리스트의 선택 상태는 서버가 아니라{" "}
          <strong className="font-semibold text-ink">이용자 브라우저의
          로컬 저장소(localStorage)</strong>에만 저장되며 사이트로 전송되지
          않습니다.
        </LI>
      </UL>

      <H2>2. 쿠키 및 유사 기술</H2>
      <P>
        사이트와 제3자(광고·분석)는 쿠키 및 유사 기술을 사용할 수 있습니다.
        이용자는 브라우저 설정에서 쿠키를 차단·삭제할 수 있으나, 일부 기능이
        제한될 수 있습니다.
      </P>

      <H2>3. 광고 (Google AdSense 등)</H2>
      <UL>
        <LI>
          사이트는 Google 등 제3자 광고 제공업체를 통해 광고를 게재할 수
          있습니다.
        </LI>
        <LI>
          Google을 포함한 제3자 공급업체는 쿠키를 사용하여 이용자의 이 사이트
          및 다른 사이트 방문 기록을 바탕으로 광고를 게재합니다.
        </LI>
        <LI>
          이용자는{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Google 광고 설정
          </a>
          에서 맞춤 광고를 해제할 수 있으며,{" "}
          <a
            href="https://www.aboutads.info/choices"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            aboutads.info
          </a>
          에서 제3자 공급업체의 쿠키 사용을 거부할 수 있습니다.
        </LI>
        <LI>
          Google의 광고 관련 개인정보 처리는{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Google 광고 정책
          </a>
          을 따릅니다.
        </LI>
      </UL>

      <H2>4. 분석 도구</H2>
      <P>
        사이트는 방문 통계 분석을 위해 Google Analytics 등 웹 분석 도구를
        사용할 수 있습니다. 이 도구는 쿠키를 통해 익명화된 이용 데이터를
        수집하며, 개별 이용자를 식별하지 않습니다.
      </P>

      <H2>5. 제휴 링크</H2>
      <P>
        사이트의 일부 외부 링크는 제휴(어필리에이트) 링크로, 이용자가 해당
        링크를 통해 구매하면 사이트에 수수료가 지급될 수 있습니다. 이는 구매자의
        추가 부담 없이 이루어지며, 링크 포함 여부가 콘텐츠의 평가 기준에 영향을
        주지 않습니다.
      </P>

      <H2>6. 제3자 제공</H2>
      <P>
        사이트는 법령에 따른 경우를 제외하고 이용자 정보를 제3자에게 판매하거나
        임의로 제공하지 않습니다. 위 광고·분석 제공업체의 데이터 처리는 각
        업체의 개인정보처리방침을 따릅니다.
      </P>

      <H2>7. 이용자의 권리</H2>
      <P>
        이용자는 브라우저에 저장된 로컬 데이터를 언제든 삭제할 수 있고, 쿠키를
        차단할 수 있습니다. 개인정보 관련 문의는 아래로 연락 주세요.
      </P>

      <H2>8. 문의</H2>
      <P>
        개인정보처리방침에 대한 문의:{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-medium text-accent hover:underline"
        >
          {CONTACT_EMAIL}
        </a>{" "}
        (
        <Link href="/contact" className="text-accent hover:underline">
          문의 페이지
        </Link>
        )
      </P>

      <P>
        본 방침은 관련 법령·서비스 변경에 따라 개정될 수 있으며, 개정 시 이
        페이지에 갱신 일자와 함께 공지합니다.
      </P>
    </LegalLayout>
  );
}
