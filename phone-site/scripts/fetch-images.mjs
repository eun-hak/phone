#!/usr/bin/env node
/**
 * 기종 실사진 수집 — Wikidata(P18) → Wikimedia Commons (자유 라이선스)
 *
 *   node scripts/fetch-images.mjs             # 전 기종
 *   node scripts/fetch-images.mjs --limit 5   # 테스트
 *   node scripts/fetch-images.mjs --force     # 기존 파일 덮어쓰기
 *
 * 산출물:
 *   public/phones/{slug}.{jpg|png}     — 폭 640px 썸네일
 *   data/phone-images.json             — {slug: {file, width, height, license, artist, sourceUrl}}
 *
 * 라이선스: Commons 이미지는 CC BY/BY-SA 등 자유 라이선스 — 출처 표기를
 * manifest 에 저장하고 기종 페이지 하단에 노출한다.
 * 이미지가 없는 기종은 사이트에서 SVG 일러스트로 자동 폴백.
 */

import fs from "node:fs";
import path from "node:path";

const FORCE = process.argv.includes("--force");
const limitArg = process.argv.indexOf("--limit");
const LIMIT =
  limitArg > -1 ? Number(process.argv[limitArg + 1]) || Infinity : Infinity;

const DATA_DIR = path.join(process.cwd(), "data", "phones");
const OUT_DIR = path.join(process.cwd(), "public", "phones");
const MANIFEST = path.join(process.cwd(), "data", "phone-images.json");
const UA = "PhondexImageFetcher/1.0 (decision dictionary; non-commercial data site)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 수동 검수에서 오매칭으로 판정된 기종 — Commons 에 올바른 이미지가 없어
 * 자동 수집을 차단한다 (사이트에서는 SVG 일러스트 폴백).
 * 좋은 이미지가 올라오면 여기서 빼고 다시 수집.
 */
const BLOCKLIST = new Set([
  "galaxy-note10", // 제네릭 "Samsung Galaxy Phone.jpg" 매칭
  "galaxy-note10-plus",
  "galaxy-s26", // 유튜브 영상 캡처 프레임
  "galaxy-s25",
  "galaxy-z-flip3", // 1세대 Z Flip 사진
  "galaxy-z-fold3", // 1세대 Z Fold 사진
  "galaxy-s10", // S10+ 사진 중복 매칭
  "galaxy-s10-5g",
]);

/** 자동 이름 생성이 안 맞는 기종 수동 매핑 (Wikidata 검색어) */
const OVERRIDES = {
  "iphone-se-2": "iPhone SE (2nd generation)",
  "iphone-se-3": "iPhone SE (3rd generation)",
  "galaxy-quantum5": "Samsung Galaxy Quantum 5",
  "galaxy-s10-5g": "Samsung Galaxy S10 5G",
};

/**
 * Commons 파일 직접 지정 — Wikidata P18 이 오매칭이거나 비어 있어
 * 수동 검수로 확정한 파일. BLOCKLIST 보다 우선한다(있으면 이걸로 수집).
 */
const COMMONS_OVERRIDES = {
  "galaxy-note10": "Samsung Galaxy Note 10 (front).jpg",
  "galaxy-note10-plus": "Samsung Galaxy Note 10+ (48533957676).jpg",
  "galaxy-note20": "Samsung Galaxy Note 20 front.png",
  "galaxy-note20-ultra": "Samsung Galaxy Note 20 Ultra Mystic Bronze.jpg",
  "galaxy-s10": "Samsung Galaxy S10 (32233892097).jpg",
  "galaxy-s10-5g": "SAMSUNG Galaxy S10 5G.jpg",
  "galaxy-s9-plus": "Samsung Galaxy S9+ standby mode, full face, cropped.jpg",
  "galaxy-s20-fe": "Samsung Galaxy S20 FE Back.jpg",
  "galaxy-s21-plus": "GalaxyS21+.png",
  "galaxy-z-flip3": "Samsung Galaxy Z Flip3 5G 001 (51542024598).jpg",
  "galaxy-z-fold3": "Samsung Galaxy Z Fold3 5G 001 (51542505259).jpg",
  "iphone-13-pro-max": "IPhone 13 Pro Max Sierra Blue 128g.jpg",
  "iphone-14-plus": "A blue iPhone 14 Plus.jpg",
};

function englishName(slug) {
  if (OVERRIDES[slug]) return OVERRIDES[slug];
  if (slug.startsWith("iphone")) {
    const rest = slug
      .replace(/^iphone-?/, "")
      .split("-")
      .map((t) => {
        if (["x", "xs", "xr", "se"].includes(t)) return t.toUpperCase();
        if (["pro", "max", "plus", "air", "mini"].includes(t))
          return t[0].toUpperCase() + t.slice(1);
        return t;
      })
      .join(" ");
    return `iPhone ${rest}`.trim();
  }
  // galaxy-*
  const tokens = slug.replace(/^galaxy-/, "").split("-");
  const parts = tokens.map((t) => {
    if (t === "z") return "Z";
    if (t === "plus") return "+";
    if (t === "ultra") return "Ultra";
    if (t === "fe") return "FE";
    if (t === "5g") return "5G";
    const m = t.match(/^(note|flip|fold|quantum)(\d.*)$/);
    if (m) return `${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}`;
    const m2 = t.match(/^([asz])(\d.*)$/);
    if (m2) return `${m2[1].toUpperCase()}${m2[2]}`;
    return t[0].toUpperCase() + t.slice(1);
  });
  let name = `Samsung Galaxy ${parts.join(" ")}`;
  return name.replace(" +", "+"); // "S24 +" → "S24+"
}

async function api(url, attempt = 1) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (res.status === 429 && attempt <= 3) {
    // 레이트리밋 — 점진 백오프 후 재시도
    await sleep(5000 * attempt);
    return api(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchEntities(name) {
  const j = await api(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&type=item&limit=5`,
  );
  return (j.search ?? []).map((s) => s.id);
}

async function getImageFile(entityId) {
  const j = await api(
    `https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${entityId}&property=P18&format=json`,
  );
  const claims = j.claims?.P18 ?? [];
  return claims[0]?.mainsnak?.datavalue?.value ?? null; // 파일명
}

async function getImageMeta(fileName) {
  const j = await api(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(`File:${fileName}`)}&prop=imageinfo&iiprop=extmetadata%7Csize&format=json`,
  );
  const pages = j.query?.pages ?? {};
  const info = Object.values(pages)[0]?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, "").trim();
  return {
    license: strip(meta.LicenseShortName?.value) || "unknown",
    artist: strip(meta.Artist?.value) || "unknown",
    width: info.width,
    height: info.height,
  };
}

async function download(fileName, destBase) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=640`;
  const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  const ext = type.includes("png") ? "png" : type.includes("svg") ? "svg" : "jpg";
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error("파일이 비정상적으로 작음");
  const dest = `${destBase}.${ext}`;
  fs.writeFileSync(dest, buf);
  return { ext, bytes: buf.length };
}

const main = async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : {};

  const slugs = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .slice(0, LIMIT);

  let ok = 0;
  const misses = [];

  for (const slug of slugs) {
    const override = COMMONS_OVERRIDES[slug];
    if (!override && BLOCKLIST.has(slug)) continue;
    if (!FORCE && manifest[slug]) {
      ok++;
      continue;
    }
    const name = englishName(slug);
    try {
      let fileName = override ?? null;
      let usedId = null;
      if (!fileName) {
        const ids = await searchEntities(name);
        await sleep(900);
        for (const id of ids) {
          fileName = await getImageFile(id);
          await sleep(900);
          if (fileName) {
            usedId = id;
            break;
          }
        }
      }
      if (!fileName) {
        misses.push(`${slug} (${name}): P18 이미지 없음`);
        continue;
      }
      const meta = await getImageMeta(fileName);
      await sleep(900);
      const { ext } = await download(fileName, path.join(OUT_DIR, slug));
      manifest[slug] = {
        file: `${slug}.${ext}`,
        commonsFile: fileName,
        license: meta?.license ?? "unknown",
        artist: meta?.artist ?? "unknown",
        sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName.replaceAll(" ", "_"))}`,
        ...(usedId ? { entity: usedId } : {}),
      };
      fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
      ok++;
      console.log(`[OK] ${slug} ← ${fileName} (${manifest[slug].license})`);
      await sleep(1500);
    } catch (e) {
      misses.push(`${slug} (${name}): ${e.message}`);
      await sleep(1500);
    }
  }

  console.log(`\n완료: ${ok}/${slugs.length} 확보, 실패 ${misses.length}건`);
  if (misses.length) {
    console.log("실패 목록 (SVG 일러스트로 폴백됨):");
    for (const m of misses) console.log(`  - ${m}`);
  }
};

main().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
