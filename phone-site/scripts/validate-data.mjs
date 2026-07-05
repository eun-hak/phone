#!/usr/bin/env node
/**
 * 데이터 구조 검증 (CI 게이트용 경량판) — 앱의 Zod 스키마(lib/phones.ts)와
 * 동일 항목을 구조적으로 검사한다. 실패 시 exit 1.
 */

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data", "phones");
const errors = [];

const isIsoDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

for (const file of fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"))) {
  const p = path.join(DATA_DIR, file);
  let d;
  try {
    d = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    errors.push(`${file}: JSON 파싱 실패 — ${e.message}`);
    continue;
  }
  const err = (msg) => errors.push(`${file}: ${msg}`);

  if (typeof d.slug !== "string" || file !== `${d.slug}.json`)
    err("slug 와 파일명이 불일치");
  if (typeof d.name !== "string" || !d.name) err("name 누락");
  if (!["samsung", "apple"].includes(d.brand)) err("brand 값 이상");
  if (!isIsoDate(d.releaseDate)) err("releaseDate 형식 이상");
  if (!Number.isFinite(d.releasePriceKRW) || d.releasePriceKRW <= 0)
    err("releasePriceKRW 이상");

  if (!d.eol || typeof d.eol !== "object") err("eol 누락");
  else {
    if (d.eol.securityEndDate !== null && !isIsoDate(d.eol.securityEndDate))
      err("eol.securityEndDate 형식 이상");
    if (typeof d.eol.estimated !== "boolean") err("eol.estimated 이상");
  }

  if (!Array.isArray(d.resale) || d.resale.length < 1)
    err("resale 최소 1개 필요");
  else {
    for (const r of d.resale) {
      if (!isIsoDate(r.date)) err(`resale.date 형식 이상 (${r.date})`);
      if (!Number.isFinite(r.priceKRW) || r.priceKRW <= 0)
        err(`resale.priceKRW 이상 (${r.date})`);
      if (r.priceKRW > d.releasePriceKRW * 1.5)
        err(`resale.priceKRW 가 출시가의 150% 초과 — 수집 오류 의심 (${r.date})`);
    }
    const months = d.resale.map((r) => r.date.slice(0, 7));
    if (new Set(months).size !== months.length)
      err("같은 달에 시세 포인트 중복");
  }

  if (!Array.isArray(d.repairCosts)) err("repairCosts 배열 아님");
  if (!Array.isArray(d.issues)) err("issues 배열 아님");
}

if (errors.length) {
  console.error(`데이터 검증 실패 ${errors.length}건:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("데이터 검증 통과 ✓");
