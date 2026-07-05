#!/usr/bin/env node
/**
 * 지원종료일 자동 갱신 — endoflife.date API (MIT, 무인증)
 *
 *   node scripts/update-eol.mjs          # 드라이런: 변경 예정 내역만 출력
 *   node scripts/update-eol.mjs --write  # data/phones/*.json 에 반영
 *
 * 정책:
 *  - 삼성: samsung-mobile.json 의 `eol`(보안 업데이트 최종 종료일)을
 *    securityEndDate 로 반영. 기존 osEndDate 가 securityEndDate 와 같았다면
 *    함께 갱신. estimated → false, source 를 endoflife.date 로 교체.
 *  - 애플: iphone.json 은 종료 "날짜"를 제공하지 않으므로(불리언뿐) 값을
 *    덮어쓰지 않고 출시일 불일치만 리포트한다. (아이폰 종료일은 추정치 유지)
 *  - 매칭 실패 기종은 목록으로 출력 — OVERRIDES 에 수동 매핑을 추가할 것.
 */

import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");
const DATA_DIR = path.join(process.cwd(), "data", "phones");
const TODAY = new Date().toISOString().slice(0, 10);

/** 우리 slug → endoflife.date cycle 수동 매핑 (자동 매칭 실패분) */
const OVERRIDES = {
  // 갤럭시 퀀텀5 = A55 5G 기반 (SKT 전용 파생 모델)
  "galaxy-quantum5": "galaxy-a55-5g",
};

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]/g, "");

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "phondex-data-refresh (contact: site admin)" },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

function buildSamsungIndex(rows) {
  const idx = new Map();
  for (const r of rows) {
    for (const key of [r.cycle, r.releaseLabel]) {
      if (!key) continue;
      const n = norm(key);
      if (!idx.has(n)) idx.set(n, r);
      // "…-5g" 접미 변형도 함께 등록 (우리 slug 는 5G 표기를 생략)
      const n5 = n.replace(/5g$/, "");
      if (n5 !== n && !idx.has(n5)) idx.set(n5, r);
    }
  }
  return idx;
}

function buildIphoneIndex(rows) {
  const idx = new Map();
  for (const r of rows) {
    for (const key of [r.cycle, r.releaseLabel]) {
      if (!key) continue;
      idx.set(norm(`iphone${key}`), r);
    }
  }
  return idx;
}

const main = async () => {
  const [samsung, iphone] = await Promise.all([
    fetchJson("https://endoflife.date/api/samsung-mobile.json"),
    fetchJson("https://endoflife.date/api/iphone.json"),
  ]);
  const samsungIdx = buildSamsungIndex(samsung);
  const iphoneIdx = buildIphoneIndex(iphone);

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const unmatched = [];
  const reports = [];
  let changed = 0;

  for (const file of files) {
    const p = path.join(DATA_DIR, file);
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    const slug = data.slug;
    const key = norm(OVERRIDES[slug] ?? slug);

    if (data.brand === "samsung") {
      const row = samsungIdx.get(key);
      if (!row) {
        unmatched.push(slug);
        continue;
      }
      // 출시일 드리프트 리포트 (수동 검토용 — 자동 반영 안 함)
      if (row.releaseDate && row.releaseDate !== data.releaseDate) {
        reports.push(
          `  [release-drift] ${slug}: 수록 ${data.releaseDate} vs eol.date ${row.releaseDate}`,
        );
      }
      const newEnd = row.eol || row.support;
      if (typeof newEnd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(newEnd)) {
        continue; // 불리언(지원중) 등 날짜가 아니면 건드리지 않음
      }
      const cur = data.eol.securityEndDate;
      if (cur !== newEnd || data.eol.estimated) {
        reports.push(
          `  [update] ${slug}: securityEndDate ${cur ?? "null"} → ${newEnd}${data.eol.estimated ? " (추정 해제)" : ""}`,
        );
        const osWasSame = data.eol.osEndDate === cur;
        data.eol.securityEndDate = newEnd;
        if (osWasSame) data.eol.osEndDate = newEnd;
        data.eol.estimated = false;
        data.eol.source = {
          label: "endoflife.date (samsung-mobile)",
          url: "https://endoflife.date/samsung-mobile",
          asOf: TODAY,
        };
        changed++;
        if (WRITE) {
          fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
        }
      }
    } else if (data.brand === "apple") {
      const row = iphoneIdx.get(key);
      if (!row) {
        unmatched.push(slug);
        continue;
      }
      if (row.releaseDate && row.releaseDate !== data.releaseDate) {
        reports.push(
          `  [release-drift] ${slug}: 수록 ${data.releaseDate} vs eol.date ${row.releaseDate}`,
        );
      }
      if (row.eol === true && data.eol.securityEndDate) {
        const end = new Date(data.eol.securityEndDate);
        if (end.getTime() > Date.now()) {
          reports.push(
            `  [check] ${slug}: eol.date 는 지원종료로 표시하는데 수록 종료일(${data.eol.securityEndDate})은 미래 — 수동 확인 필요`,
          );
        }
      }
    }
  }

  console.log(`endoflife.date 갱신 ${WRITE ? "(반영 모드)" : "(드라이런)"}`);
  console.log(`검사 ${files.length}개 / 변경 ${changed}건`);
  if (reports.length) {
    console.log("\n상세:");
    for (const r of reports) console.log(r);
  }
  if (unmatched.length) {
    console.log(
      `\n매칭 실패 ${unmatched.length}건 (OVERRIDES 에 수동 매핑 추가 필요):`,
    );
    for (const s of unmatched) console.log(`  - ${s}`);
  }
  if (!WRITE && changed > 0) {
    console.log("\n반영하려면: node scripts/update-eol.mjs --write");
  }
};

main().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
