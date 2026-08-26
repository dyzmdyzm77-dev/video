"use client";

import { toPng } from "html-to-image";
import { VARIANT_LABEL, readVariant, type VariantKey } from "./variantRoute";

// ============================================================================
// 지금 보고 있는 화면을 PNG 로 받기 (데스크톱 미리보기 전용)
// ============================================================================
// 시안을 캡처해 문서·메신저에 붙일 일이 잦은데, OS 스크린샷으로 잘라내면 배율이
// 제각각이고 목업 그림자까지 딸려 온다(사용자 요청 2026-08-26: "캡쳐 버튼 만들어줘,
// 누르면 해당 시안 png 로 다운받게").
//
// 화면에 보이는 축소본이 아니라 '앱 프레임 원본 크기'로 뽑는다 — 405×648 기기면
// 405×648(레티나 배수는 pixelRatio 로). html-to-image 는 노드를 복제해 제 크기로
// 그리므로, 바깥에 걸린 --device-scale(transform)은 자연히 빠진다.
//
// 비교하기가 켜져 있으면 나란히 선 기기들을 왼쪽부터 한 장으로 이어 붙인다 —
// 비교 화면은 따로따로 받으면 다시 붙이는 수고가 생긴다.
// ============================================================================

/** 레티나 배수. 2 면 405×648 → 810×1296 png. */
const PIXEL_RATIO = 2;
/** 비교 이미지를 이어 붙일 때 기기 사이 간격(px, 원본 기준). 화면의 50 과 같은 값. */
const JOIN_GAP = 50;

/** 캡처 대상 — 왼쪽(비교) 기기부터 오른쪽(시안) 순서. */
function shotTargets(): HTMLElement[] {
  const root = document.documentElement;
  const compare = root.dataset.compare === "true";
  const asisOnly = root.dataset.asisOnly === "true";
  const out: HTMLElement[] = [];
  if (compare) {
    // 가장 바깥(자리 2) → 자리 1 순서. 화면에 보이는 왼쪽부터다.
    const slot2 = document.querySelector<HTMLElement>(".asis-frame--2 .asis-screen");
    const slot1 = document.querySelector<HTMLElement>(
      ".asis-frame:not(.asis-frame--2) .asis-screen",
    );
    if (slot2) out.push(slot2);
    if (slot1) out.push(slot1);
  } else if (asisOnly) {
    const asis = document.querySelector<HTMLElement>(".asis-screen");
    if (asis) return asis ? [asis] : [];
  }
  // 시안(오른쪽) 앱 프레임. As Is 단독이면 위에서 이미 담았고 이 프레임은 숨어 있다.
  if (!asisOnly) {
    const main = Array.from(
      document.querySelectorAll<HTMLElement>(".app-safe-frame"),
    ).find((el) => !el.closest(".asis-frame"));
    if (main) out.push(main);
  }
  return out;
}

/** 파일 이름 — 어느 안을, 어떤 크기로, 어떤 화면에서 찍었는지가 이름에 남는다. */
function shotName(count: number): string {
  const cs = getComputedStyle(document.documentElement);
  const w = Math.round(parseFloat(cs.getPropertyValue("--device-w")) || 360);
  const h = Math.round(parseFloat(cs.getPropertyValue("--device-h")) || 780);
  const d = document.documentElement.dataset;
  const asisOnly = d.asisOnly === "true";
  const variant = asisOnly
    ? "AsIs"
    : VARIANT_LABEL[readVariant("a1") as VariantKey].replace(/안$/, "");
  const mode = d.screenMode === "recording" ? "녹화" : "실시간";
  const screen = d.screenSingle ? "단일" : "다채널";
  const many = count > 1 ? `_비교${count}` : "";
  return `${variant}_${w}x${h}_${mode}_${screen}${many}.png`;
}

/** 여러 장을 왼쪽부터 가로로 이어 붙인다(바닥 정렬 — 화면에서 보던 그대로). */
async function joinShots(shots: HTMLImageElement[]): Promise<string> {
  const gap = JOIN_GAP * PIXEL_RATIO;
  const width =
    shots.reduce((sum, img) => sum + img.width, 0) + gap * (shots.length - 1);
  const height = Math.max(...shots.map((img) => img.height));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return shots[0].src;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  let x = 0;
  for (const img of shots) {
    // 화면에서도 바닥이 맞아 있다(기기 크기가 달라도 아랫변 기준).
    ctx.drawImage(img, x, height - img.height);
    x += img.width + gap;
  }
  return canvas.toDataURL("image/png");
}

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// ── GIF 를 잠깐 정지 화면으로 바꿔 두기 ────────────────────────────────────
// html-to-image 는 <img> 를 전부 dataURL 로 인라인한다. 카메라 GIF 는 한 장에
// 2~4MB 라, 여덟 타일이면 base64 로 십수 MB 를 만들다 30초가 넘게 걸렸다.
// 어차피 PNG 는 정지 화면이므로, 캡처 직전에 지금 프레임만 캔버스로 떠서 작은
// PNG dataURL 로 바꿔 끼우고 끝나면 되돌린다. 화면에 보이던 그 프레임 그대로다.
async function freezeGifs(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img")).filter(
    (img) => img.currentSrc && !img.currentSrc.startsWith("data:"),
  );
  const undo: (() => void)[] = [];
  for (const img of imgs) {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) continue;
    // 원본 크기 그대로 뜨면(1920×1080 GIF) 캔버스 → PNG 변환만으로도 몇 초가 간다.
    // 화면에 보이는 크기 × 레티나 배수까지만 뜬다 — 비율은 원본 그대로 유지해서
    // object-fit(cover) 이 걸린 타일도 지금과 똑같이 잘린다.
    const shown = img.getBoundingClientRect().width;
    const w = Math.max(1, Math.min(nw, Math.round(shown * PIXEL_RATIO) || nw));
    const h = Math.max(1, Math.round((nh * w) / nw));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    try {
      ctx.drawImage(img, 0, 0, w, h);
      const frozen = canvas.toDataURL("image/png");
      const original = img.getAttribute("src");
      img.setAttribute("src", frozen);
      undo.push(() => {
        if (original === null) img.removeAttribute("src");
        else img.setAttribute("src", original);
      });
    } catch {
      // 다른 출처 이미지 등으로 캔버스가 오염되면 그냥 원본을 쓴다.
    }
  }
  return () => undo.forEach((fn) => fn());
}

/** 지금 화면을 PNG 로 만들어 dataURL 로 돌려준다(다운로드는 안 한다). */
export async function captureShot(): Promise<{ url: string; name: string } | null> {
  const targets = shotTargets();
  if (!targets.length) return null;
  const opts = {
    pixelRatio: PIXEL_RATIO,
    backgroundColor: "#FFFFFF",
    // 목업 밖 요소(치수 눈금자·드래그 핸들)는 애초에 대상 밖이라 걸릴 게 없다.
    cacheBust: false,
    // 웹폰트를 안 쓴다(@font-face 가 없다) — 스타일시트를 뒤질 이유가 없다.
    skipFonts: true,
    // 미리보기 축소(--device-scale)를 지운다. 이 프레임은 자기 자신에게
    // transform: scale(0.72) 가 걸려 있고(원점은 왼쪽 아래), 그대로 복제하면
    // 캡처 안에서도 72% 로 줄어 위쪽에 흰 여백이 남는다. 우리가 원하는 건
    // 앱 프레임 원본 크기(360×780 등)라 여기서 꺼 준다.
    style: { transform: "none", transformOrigin: "top left" },
  };
  const urls: string[] = [];
  for (const el of targets) {
    const thaw = await freezeGifs(el);
    try {
      // 같은 노드를 두 번 그린다 — 첫 판은 방금 끼운 dataURL 이 아직 안 붙어
      // 빠지는 게 있다(html-to-image 의 알려진 버릇). 두 번째 결과만 쓴다.
      await toPng(el, opts);
      urls.push(await toPng(el, opts));
    } finally {
      thaw();
    }
  }
  const url =
    urls.length === 1 ? urls[0] : await joinShots(await Promise.all(urls.map(load)));
  return { url, name: shotName(urls.length) };
}

/** 캡처해서 바로 내려받는다.
 *
 *  주의 — html-to-image 는 마지막에 requestAnimationFrame 을 한 번 기다린다.
 *  탭이 뒤로 숨으면 rAF 가 안 돌아 그동안 멈춘 것처럼 보인다(다시 앞으로 오면
 *  이어서 끝난다). 캡처는 보고 있는 탭에서 누르는 게 맞다. */
export async function downloadShot(): Promise<boolean> {
  const shot = await captureShot();
  if (!shot) return false;
  const a = document.createElement("a");
  a.href = shot.url;
  a.download = shot.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}

// 자동 점검용 — 개발 모드에서만 창에 걸어 둔다. 브라우저에서 결과(dataURL)를
// 바로 받아 보려고 둔 것이지 화면 기능이 아니다(운영 빌드에는 안 들어간다).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __captureShot?: typeof captureShot }).__captureShot =
    captureShot;
}
