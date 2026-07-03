import type { PhoneWithMetrics } from "./phones";
import {
  formatManwon,
  formatMonthsAsYears,
  formatPct,
  formatYearMonth,
} from "./format";

/**
 * 중고 구매 체크리스트 — 새 데이터 없이 기존 이슈·수리비·시세·지원종료를
 * 재조합해 기종별 맞춤 항목을 생성한다. (서버에서 계산, 직렬화 가능)
 */

export type CheckPriority = "critical" | "important" | "normal";

export interface UsedCheckItem {
  id: string;
  text: string;
  priority: CheckPriority;
  detail?: string;
}

export interface UsedCheckSection {
  key: string;
  title: string;
  lede?: string;
  items: UsedCheckItem[];
}

export interface UsedCheckData {
  sections: UsedCheckSection[];
  total: number;
  criticalCount: number;
}

export function buildUsedCheck(phone: PhoneWithMetrics): UsedCheckData {
  const m = phone.metrics;
  const sections: UsedCheckSection[] = [];

  /* ── 1) 이 기종 특유 (이슈 데이터에서) ── */
  const modelItems: UsedCheckItem[] = [];
  const liveIssues = phone.issues.filter(
    (i) =>
      i.status === "open" || i.status === "recall" || i.status === "free-repair",
  );
  for (const issue of liveIssues) {
    const isCritical = issue.severity === "critical";
    const covered = issue.status === "free-repair" || issue.status === "recall";
    modelItems.push({
      id: `issue-${issue.id}`,
      priority: isCritical ? "critical" : "important",
      text: `${issue.title} — 증상 여부 확인`,
      detail:
        (issue.symptoms[0] ? `증상 예: ${issue.symptoms[0]}. ` : "") +
        (covered
          ? "무상수리·리콜 대상일 수 있으니 서비스센터에서 대상 여부를 확인하세요."
          : isCritical
            ? "이 기종의 알려진 중대 결함이라, 발견 시 구매 보류를 권합니다."
            : "구매 전 대면으로 반드시 확인하세요."),
    });
  }
  const patched = phone.issues.filter((i) => i.status === "patched");
  if (patched.length > 0) {
    modelItems.push({
      id: "issue-patched",
      priority: "normal",
      text: "최신 소프트웨어로 업데이트되어 있는지 확인",
      detail: `${patched
        .map((i) => i.title)
        .join(", ")}은(는) 업데이트로 해결된 알려진 이슈입니다. 최신 버전이면 문제없습니다.`,
    });
  }
  if (modelItems.length === 0) {
    modelItems.push({
      id: "issue-none",
      priority: "normal",
      text: "이 기종 특유의 알려진 결함은 없습니다",
      detail: "아래의 일반 중고 확인 사항만 점검하면 됩니다.",
    });
  }
  sections.push({
    key: "model",
    title: "이 기종 특유의 확인",
    lede: `${phone.name}에서 반복 보고된 이슈를 반영한 항목입니다.`,
    items: modelItems,
  });

  /* ── 2) 배터리·외관 상태 (수리비 데이터에서) ── */
  const battery = phone.repairCosts.find((r) => r.part === "battery");
  const stateItems: UsedCheckItem[] = [];
  stateItems.push({
    id: "battery-health",
    priority: "important",
    text: "배터리 성능 상태 확인",
    detail:
      (phone.brand === "apple"
        ? "설정 > 배터리 > 배터리 성능 상태에서 최대 용량을 확인하세요. "
        : "삼성 멤버스 앱 > 진단 > 배터리 상태를 확인하세요. ") +
      (battery
        ? `85% 미만이면 배터리 교체비 ${formatManwon(battery.officialKRW)}만큼 시세에서 깎는 게 정당합니다.`
        : "성능이 낮으면 교체 비용을 감안해 협상하세요."),
  });
  if (
    m.repairBurdenPct !== null &&
    m.repairBurdenPct >= 60 &&
    m.displayRepairKRW !== null
  ) {
    stateItems.push({
      id: "screen-burden",
      priority: "important",
      text: "액정·프레임 파손 여부를 특히 꼼꼼히",
      detail: `이 기종은 화면 수리비 ${formatManwon(m.displayRepairKRW)}가 현 시세의 ${formatPct(
        m.repairBurdenPct,
        0,
      )}라, 파손 시 수리보다 교체가 나은 수준입니다. 작은 흠집도 시세에 크게 반영하세요.`,
    });
  } else {
    stateItems.push({
      id: "screen-check",
      priority: "normal",
      text: "화면 번인·잔상·데드픽셀 확인",
      detail:
        "밝은 회색·검은색 전체 화면을 띄워 얼룩·번인·죽은 픽셀이 없는지 확인하세요.",
    });
  }
  stateItems.push({
    id: "physical-test",
    priority: "important",
    text: "현장에서 전원·터치·카메라·버튼·스피커 테스트",
    detail:
      "대면 거래 시 통화, 전·후면 카메라, 지문/얼굴 인식, 무선충전까지 직접 확인하세요.",
  });
  sections.push({ key: "state", title: "배터리·외관 상태", items: stateItems });

  /* ── 3) 적정가·잔여 수명 (시세·지원종료 데이터에서) ── */
  const priceItems: UsedCheckItem[] = [];
  priceItems.push({
    id: "fair-price",
    priority: "important",
    text: `A급 적정 시세는 약 ${formatManwon(m.latestResale)}`,
    detail: `기준일 ${m.latestResaleDate}, 상태 A급 개인거래 기준. 이보다 크게 싸면 상태·잔여 할부·활성화 잠금을 의심하세요.`,
  });
  if (phone.eol.securityEndDate) {
    const soon = m.monthsLeftSecurity !== null && m.monthsLeftSecurity < 24;
    priceItems.push({
      id: "support-left",
      priority: soon ? "important" : "normal",
      text: "보안 업데이트 잔여 기간 확인",
      detail: `${formatYearMonth(phone.eol.securityEndDate)}까지${
        phone.eol.estimated ? "(추정)" : ""
      } · ${
        m.monthsLeftSecurity !== null && m.monthsLeftSecurity > 0
          ? formatMonthsAsYears(m.monthsLeftSecurity) + " 남음"
          : "종료됨"
      }.${
        soon ? " 2년 이상 쓸 계획이면 지원이 더 긴 기종을 고려하세요." : ""
      }`,
    });
  }
  sections.push({ key: "price", title: "적정가·잔여 수명", items: priceItems });

  /* ── 4) 거래 안전 (공통, 브랜드 분기) ── */
  const safeItems: UsedCheckItem[] = [
    {
      id: "activation-lock",
      priority: "critical",
      text: "활성화 잠금 해제 확인",
      detail:
        phone.brand === "apple"
          ? "판매자가 '나의 찾기(Find My)'를 끄고 Apple 계정에서 로그아웃했는지 확인하세요. 안 풀면 초기화해도 못 쓰는 '벽돌'이 됩니다."
          : "판매자가 삼성 계정·구글 계정에서 로그아웃했는지 확인하세요. 계정 잠금이 걸리면 초기화해도 사용할 수 없습니다.",
    },
    {
      id: "imei",
      priority: "critical",
      text: "IMEI로 분실·도난·미납 이력 조회",
      detail:
        "통신사·이통사 조회로 분실/도난 신고와 할부 미납(블랙리스트) 여부를 확인하세요. 개통 후 정지될 수 있습니다.",
    },
    {
      id: "installment",
      priority: "important",
      text: "잔여 할부금·약정 없는 기기인지 확인",
      detail:
        "판매자의 남은 할부가 있으면 미납 시 기기가 정지될 수 있습니다. '깨끗한' 기기인지 확인하세요.",
    },
    {
      id: "water-damage",
      priority: "normal",
      text: "침수 여부(침수 라벨·LDI) 확인",
      detail:
        "침수 이력은 시간차로 고장을 유발합니다. 서비스센터 점검 이력이 있으면 요청하세요.",
    },
  ];
  sections.push({
    key: "safety",
    title: "거래 안전 (공통)",
    lede: "기종과 무관하게 중고 거래에서 반드시 확인할 사항입니다.",
    items: safeItems,
  });

  const total = sections.reduce((a, s) => a + s.items.length, 0);
  const criticalCount = sections.reduce(
    (a, s) => a + s.items.filter((i) => i.priority === "critical").length,
    0,
  );
  return { sections, total, criticalCount };
}
