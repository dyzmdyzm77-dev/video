"use client";

import { toPng } from "html-to-image";
import { VARIANT_LABEL, readVariant } from "./variantRoute";
import { readCompareTarget, type CompareTarget } from "./compareTarget";
import type { DeviceScope } from "./deviceScope";

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
// 비교하기가 켜져 있으면 기기마다 한 장씩 받는다(사용자 지정 2026-08-26:
// "합쳐서 말고 각각"). 파일 이름에 어느 안인지와 그 기기 해상도가 들어간다.
// ============================================================================

/** 레티나 배수. 2 면 405×648 → 810×1296 png. */
const PIXEL_RATIO = 2;

/** 캡처 대상 하나 — 어떤 기기(요소)를, 무슨 이름으로 저장할지. */
type Target = { el: HTMLElement; name: string };

/** 이 자리(0 = 시안, 1·2 = 비교)의 기기 크기. 자리 변수는 CSS 가 '자리 값 →
 *  없으면 시안 값' 으로 풀어 둔다(compareSize.ts). */
function slotSize(slot: DeviceScope): string {
  const cs = getComputedStyle(document.documentElement);
  const num = (name: string, fallback: number) =>
    Math.round(parseFloat(cs.getPropertyValue(name)) || fallback);
  const w = slot ? num(`--dev${slot}-w`, 360) : num("--device-w", 360);
  const h = slot ? num(`--dev${slot}-h`, 780) : num("--device-h", 780);
  return `${w}x${h}`;
}

/** 지금 보고 있는 화면 종류 — 파일 이름 꼬리표(실시간/녹화 · 단일/다채널). */
function screenTag(): string {
  const d = document.documentElement.dataset;
  const mode = d.screenMode === "recording" ? "녹화" : "실시간";
  const screen = d.screenSingle ? "단일" : "다채널";
  return `${mode}_${screen}`;
}

const targetLabel = (t: CompareTarget) =>
  t === "asis" ? "AsIs" : VARIANT_LABEL[t].replace(/안$/, "");

/** 캡처 대상 — 왼쪽(비교) 기기부터 오른쪽(시안) 순서.
 *  비교하기면 기기마다 한 장씩이다(사용자 지정 2026-08-26: "합쳐서 말고 각각").
 *  이름에 어느 안인지·그 기기 해상도가 들어가므로 파일만 봐도 구분이 된다. */
function shotTargets(): Target[] {
  const root = document.documentElement;
  const compare = root.dataset.compare === "true";
  const asisOnly = root.dataset.asisOnly === "true";
  const tag = screenTag();
  const out: Target[] = [];
  if (compare) {
    const slots: [1 | 2, string][] = [
      [2, ".asis-frame--2 .asis-screen"],
      [1, ".asis-frame:not(.asis-frame--2) .asis-screen"],
    ];
    for (const [slot, sel] of slots) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) continue;
      const who = targetLabel(readCompareTarget(slot));
      out.push({ el, name: `${who}_${slotSize(slot)}_${tag}.png` });
    }
  } else if (asisOnly) {
    const el = document.querySelector<HTMLElement>(".asis-screen");
    if (el) out.push({ el, name: `AsIs_${slotSize(0)}_${tag}.png` });
    return out;
  }
  // 시안(오른쪽) 앱 프레임. As Is 단독이면 위에서 이미 담았다.
  const main = Array.from(
    document.querySelectorAll<HTMLElement>(".app-safe-frame"),
  ).find((el) => !el.closest(".asis-frame"));
  if (main) {
    const who = targetLabel(readVariant("a1"));
    out.push({ el: main, name: `${who}_${slotSize(0)}_${tag}.png` });
  }
  return out;
}

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

/** 지금 화면을 PNG 로 만든다. 비교하기면 기기 수만큼 나온다(왼쪽부터). */
export async function captureShot(): Promise<{ url: string; name: string }[]> {
  const targets = shotTargets();
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
  const shots: { url: string; name: string }[] = [];
  for (const t of targets) {
    const thaw = await freezeGifs(t.el);
    try {
      // 같은 노드를 두 번 그린다 — 첫 판은 방금 끼운 dataURL 이 아직 안 붙어
      // 빠지는 게 있다(html-to-image 의 알려진 버릇). 두 번째 결과만 쓴다.
      await toPng(t.el, opts);
      shots.push({ url: await toPng(t.el, opts), name: t.name });
    } finally {
      thaw();
    }
  }
  return shots;
}

/** 캡처해서 바로 내려받는다. 비교하기면 기기마다 한 장씩, 왼쪽부터.
 *
 *  주의 — html-to-image 는 마지막에 requestAnimationFrame 을 한 번 기다린다.
 *  탭이 뒤로 숨으면 rAF 가 안 돌아 그동안 멈춘 것처럼 보인다(다시 앞으로 오면
 *  이어서 끝난다). 캡처는 보고 있는 탭에서 누르는 게 맞다. */
export async function downloadShot(): Promise<number> {
  const shots = await captureShot();
  for (const shot of shots) {
    const a = document.createElement("a");
    a.href = shot.url;
    a.download = shot.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // 연달아 쏘면 브라우저가 뒤엣것을 흘린다 — 한 박자씩 띄운다.
    // (크롬은 '여러 파일 다운로드' 를 한 번 물어본다 — 허용해 두면 그다음부터 조용하다.)
    if (shots.length > 1) await new Promise((r) => setTimeout(r, 400));
  }
  return shots.length;
}

// 자동 점검용 — 개발 모드에서만 창에 걸어 둔다. 브라우저에서 결과(dataURL)를
// 바로 받아 보려고 둔 것이지 화면 기능이 아니다(운영 빌드에는 안 들어간다).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __captureShot?: typeof captureShot }).__captureShot =
    captureShot;
}
