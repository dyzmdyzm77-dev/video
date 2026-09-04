"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  requestCompareTarget,
  useCompareTarget,
  COMPARE_SLOTS,
  type CompareSlot,
  type CompareTarget,
} from "./compareTarget";
import {
  applyCompareSizes,
  requestCompareSize,
  useCompareSize,
} from "./compareSize";
import {
  DEFAULT_PRESET,
  DEVICES,
  presetMmPerDp,
  presetName,
  presetSize,
} from "./devicePresets";
import { downloadShot } from "./captureShot";
import {
  exitImmersive,
  readImmersive,
  useImmersive,
} from "./immersive";
import {
  DEVICE_ROTATE_EVENT,
  LANDSCAPE_EVENT,
  setBarColor,
} from "./deviceRotate";
import {
  requestStorageMode,
  useStorageMode,
  type StorageMode,
} from "./storageMode";
import {
  VARIANT_EVENT,
  readVariant,
  requestVariant,
  variantFromPath,
  VARIANT_LABEL,
  type VariantKey,
} from "./variantRoute";

// 데스크톱 전용: 화면 왼쪽 가장자리에 붙는 LNB 패널(좌측 레일).
// 접으면 각 메뉴의 아이콘만, 펼치면 아이콘+메뉴명이 보인다.
// 두 그룹 — 화면안(A/B) + 해상도(디바이스 폭) 선택.
// 모바일/터치에선 CSS(.desktop-variant-nav)로 숨긴다.
// 순서·라벨은 사용자가 정한다(2026-08-11: A안 → 'A-2안', 자리는 두 번째).
// 주소는 /a1 · /a2 · /b. 옛 /a 링크는 기본인 A-1안으로 간다(variantRoute).
const VARIANTS: { key: VariantKey; icon: string }[] = [
  { key: "a1", icon: "A-1" },
  { key: "a2", icon: "A-2" },
  { key: "a3", icon: "A-3" },
  { key: "a4", icon: "A-4" },
  { key: "a4m01", icon: "A-4(수정01)" },
];

// 해상도 프리셋(DEVICES)은 devicePresets.ts 에 있다 — 좌측 패널뿐 아니라 비교
// 자리의 해상도 드롭다운도 같은 목록을 쓴다.

// 저장 방식 세그먼트. token 은 접힘(64px) 레일에 들어갈 짧은 이름 —
// 두 칸을 세로로 쌓아도 글자가 들어갈 폭이 30px 남짓이라 '클라우드'(네 글자)도
// 'CLOUD'(다섯 자)도 잘린다. 세 글자로 맞춘다(뜻은 title 툴팁이 받는다).
const STORAGE_MODES: { key: StorageMode; token: string; label: string }[] = [
  { key: "nvr", token: "NVR", label: "NVR" },
  { key: "cloud", token: "CLD", label: "클라우드" },
];

// 비교하기 왼쪽에 놓을 수 있는 것들 — As Is(현행 앱) + 네 안.
const COMPARE_TARGETS: CompareTarget[] = ["asis", "a1", "a2", "a3", "a4", "a4m01"];
// 나란히 놓을 기기 대수(오른쪽 시안 포함). 2 = 왼쪽 한 대 … 4 = 왼쪽 세 대.
type CompareCount = 2 | 3 | 4;
const COMPARE_COUNTS: { n: CompareCount; token: string; label: string }[] = [
  { n: 2, token: "2", label: "2개" },
  { n: 3, token: "3", label: "3개" },
  { n: 4, token: "4", label: "4개" },
];

// 가로:세로 비율. 이름 없는 제너릭 폭 라벨에 "360px(6:13)"처럼 붙인다.
// 흔한 비율에 아주 가까우면(≤0.8%) 그 예쁜 비율을 쓰고(620×780→4:5 등),
// 아니면 약분한 정수비를 그대로 쓴다(360→6:13, 1080→18:13 등).
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
// 접힘 폰(405×648)은 5:8 대신 관용 표기 10:16 을, 울트라(750×832)는 9:10 을 쓴다.
const PREFERRED_RATIOS: [number, number][] = [
  [1, 1],
  [4, 3],
  [3, 4],
  [3, 2],
  [2, 3],
  [16, 9],
  [9, 16],
  [16, 10],
  [10, 16],
  [9, 10],
  [10, 9],
  [4, 5],
  [5, 4],
  [2, 1],
  [1, 2],
];
const ratioText = (w: number, h: number) => {
  const t = w / h;
  for (const [a, b] of PREFERRED_RATIOS) {
    if (Math.abs(a / b - t) < t * 0.008) return `${a}:${b}`;
  }
  const g = gcd(w, h) || 1;
  const ew = w / g;
  const eh = h / g;
  if (ew <= 20 && eh <= 20) return `${ew}:${eh}`;
  // 약분해도 큰 수면(폴드 접힘 476×752 → 119:188) 비율로 안 읽힌다. 20 이하
  // 정수비 중 가장 가까운 것을 근사로 준다 — DeviceResizer 와 같은 방식이다.
  let best = { a: 1, b: 1, err: Infinity };
  for (let b = 1; b <= 20; b++) {
    for (let a = 1; a <= 20; a++) {
      if (gcd(a, b) !== 1) continue;
      const err = Math.abs(a / b - t);
      if (err < best.err - 1e-9) best = { a, b, err };
    }
  }
  return `≈${best.a}:${best.b}`;
};

export default function DesktopVariantNav() {
  const pathname = usePathname();
  // 지금 보고 있는 안. 안 전환은 URL 을 안 건드리므로(variantRoute.ts) 경로만
  // 보면 강조가 어긋난다 — 경로를 초기값으로 두고 전환 이벤트를 따라간다.
  const routeVariant = variantFromPath(pathname);
  const [variant, setVariant] = useState<VariantKey>(routeVariant);
  useEffect(() => {
    const sync = () => setVariant(readVariant(routeVariant));
    sync();
    window.addEventListener(VARIANT_EVENT, sync);
    return () => window.removeEventListener(VARIANT_EVENT, sync);
  }, [routeVariant]);
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(DEFAULT_PRESET); // 강조 표시할 DEVICES 인덱스
  // PNG 저장 진행 상태 — 큰 화면은 1초 남짓 걸려서 누른 티가 나야 한다.
  const [shooting, setShooting] = useState(false);
  const [showRuler, setShowRuler] = useState(true); // 목업 위 치수 눈금자 표시 여부
  const [actualSize, setActualSize] = useState(false); // 배율 1:1 고정 여부
  const [compare, setCompare] = useState(false); // As Is(현재 앱) 나란히 비교 여부
  // 몇 개를 나란히 볼지(오른쪽 시안 포함). 3 이면 왼쪽에 비교 기기가 둘,
  // 4 면 셋이다(사용자 요청 2026-08-24 "최대 3개까지" → 2026-08-31 "4개까지").
  const [compareCount, setCompareCount] = useState<CompareCount>(2);
  // As Is 를 '화면 시안' 목록에서 골라 단독으로 보는 상태(사용자 요청 2026-08-18:
  // "As Is도 화면안 선택 목록에 넣어줄 수 있어?"). 비교하기와 달리 시안 대신
  // As Is 하나만 가운데 기기에 띄운다 — 문서 루트 플래그로 알리고 CSS 가 자리를
  // 옮긴다(AsIsPanel 은 이 플래그도 구독한다).
  const [asisOnly, setAsisOnly] = useState(false);
  const [rotated, setRotated] = useState(false); // 디바이스 시각적 90° 회전(가로)
  // 확대 중에는 회전을 막는다(위 버튼 주석 참고).
  const immersive = useImmersive();
  // 비교하기 왼쪽에 놓을 대상(기본 As Is). 자리 2·3 은 3개·4개 비교일 때만 쓴다.
  const compareWith = useCompareTarget(1);
  const compareWith2 = useCompareTarget(2);
  const compareWith3 = useCompareTarget(3);
  // 비교 자리마다 따로 고른 해상도(-1 = 시안과 같음). 값은 DEVICES 인덱스이고
  // 실제 크기 반영은 compareSize.ts 가 CSS 변수로 한다.
  const size1 = useCompareSize(1);
  const size2 = useCompareSize(2);
  const size3 = useCompareSize(3);
  // 저장 방식(NVR / 클라우드). 값은 문서 루트에 실려 안들이 구독한다.
  const storage = useStorageMode();

  // 오른쪽(시안) 캡션 — 비교 대상이 As Is 면 예전처럼 'To Be', 시안끼리 비교하면
  // 어느 안인지 적는다(왼쪽 캡션과 짝이 맞아야 어느 쪽이 뭔지 읽힌다).
  useEffect(() => {
    const el = document.querySelector(".device-caption");
    if (el) {
      // 왼쪽이 전부 As Is 면 예전처럼 'To Be'. 한 자리라도 시안이면 어느 안인지
      // 적는다 — 안끼리 비교할 땐 이름이 없으면 어느 쪽이 뭔지 안 읽힌다.
      const leftAll =
        compareWith === "asis" &&
        (compareCount < 3 || compareWith2 === "asis") &&
        (compareCount < 4 || compareWith3 === "asis");
      el.textContent = leftAll ? "To Be" : VARIANT_LABEL[variant];
    }
  }, [compareWith, compareWith2, compareWith3, compareCount, variant]);
  // 직접 입력(커스텀 해상도) — 가로·세로 px.
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  // 자리 해상도를 CSS 변수로 반영한다. 가로 모드에선 프리셋도 눕혀야 하므로
  // (applyCompareSizes 가 처리) 회전이 끝날 때마다 다시 건다 — 안 그러면 시안만
  // 눕고 해상도를 못 박은 비교 기기는 세로로 남는다.
  useEffect(() => {
    applyCompareSizes();
    const onLand = () => applyCompareSizes();
    window.addEventListener(LANDSCAPE_EVENT, onLand);
    return () => window.removeEventListener(LANDSCAPE_EVENT, onLand);
  }, []);

  // 치수 눈금자 표시를 문서 루트에 반영한다(CSS 가 data-show-ruler 로 숨김 처리).
  useEffect(() => {
    document.documentElement.dataset.showRuler = showRuler ? "true" : "false";
  }, [showRuler]);

  // 실제 사이즈(1:1) 여부를 문서 루트에 반영하고 배율을 다시 계산하게 한다.
  useEffect(() => {
    document.documentElement.dataset.actualSize = actualSize ? "true" : "false";
    window.dispatchEvent(new Event("devicechange"));
  }, [actualSize]);

  // ?compare=1 이면 처음부터 비교 모드로 연다(platform·chrome 과 같은 방식).
  // ?storage=cloud 면 클라우드로 시작한다 — 좌측 패널은 데스크톱 전용이라
  // 폰으로 미리보기를 열어 볼 땐 쿼리가 유일한 진입점이다.
  // ?thumbs= 는 저장 방식으로 합쳐지기 전의 옛 이름이다(이미 돌아다니는 링크가
  // 있어 그대로 받는다). 썸네일 있음 = 클라우드, 없음 = NVR.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    // ?compare=1 은 2개(예전 그대로), ?compare=3·4 면 그 대수로 연다.
    const cmp = sp.get("compare");
    if (cmp === "1" || cmp === "2" || cmp === "3" || cmp === "4")
      setCompare(true);
    if (cmp === "3") setCompareCount(3);
    if (cmp === "4") setCompareCount(4);
    const thumbs = sp.get("thumbs");
    if (thumbs === "0") requestStorageMode("nvr");
    if (thumbs === "1") requestStorageMode("cloud");
    if (sp.get("storage") === "cloud") requestStorageMode("cloud");
    if (sp.get("storage") === "nvr") requestStorageMode("nvr");
  }, []);

  // 비교하기(As Is 나란히) 여부와 대수를 문서 루트에 반영한다(AsIsPanel·
  // DeviceScaler 가 구독). 대수는 '왼쪽 자리 수'로 싣는다(2개 비교 = 1).
  useEffect(() => {
    document.documentElement.dataset.compare = compare ? "true" : "false";
    document.documentElement.dataset.compareSlots = String(compareCount - 1);
    window.dispatchEvent(new Event("comparechange"));
  }, [compare, compareCount]);

  useEffect(() => {
    document.documentElement.dataset.asisOnly = asisOnly ? "true" : "false";
    window.dispatchEvent(new Event("asisonlychange"));
  }, [asisOnly]);

  // 프리셋 크기를 문서 루트에 반영하고 강조 인덱스를 맞춘다.
  const applyPreset = (i: number) => {
    const d = DEVICES[i];
    const root = document.documentElement;
    // 가로 모드면 프리셋도 눕혀서 적용한다 — 안 그러면 세로로 되돌아간다.
    const land = root.dataset.landscape === "true";
    // 실기기 몸체 폭이 적힌 프리셋은 '1dp 가 몇 mm 인가'를 그대로 넘긴다 —
    // '실제 사이즈로 보기'가 폭 구간표 대신 이 값을 쓴다(DeviceScaler).
    // 세로 기준으로 낸 밀도라 눕혀도 그대로 맞는다.
    // 크기(--device-w)보다 **먼저** 심는다 — 크기가 바뀌는 순간 DeviceScaler 가
    // 다시 재는데, 나중에 심으면 그 계산이 직전 기기의 밀도를 본다.
    const mmPerDp = presetMmPerDp(d);
    if (mmPerDp) {
      root.style.setProperty("--device-mm-per-dp", String(mmPerDp));
    } else {
      root.style.removeProperty("--device-mm-per-dp");
    }
    root.style.setProperty("--device-w", `${land ? d.h : d.w}px`);
    root.style.setProperty("--device-h", `${land ? d.w : d.h}px`);
    root.style.setProperty("--device-radius", `${d.r}px`);
    root.style.setProperty("--device-margin", `${d.m}px`);
    // 펀치홀 카메라 위치 — 실기기처럼 기기별로 다르다(CSS 가 참조).
    // 트라이폴드(1080): 오른쪽 / Fold 8(864): 왼쪽 열 영상 중앙 / 그 외: 상단 중앙.
    root.dataset.punch =
      d.w >= 1080 ? "trifold" : d.w >= 864 ? "fold8" : "center";
    // 이름 있는 실기기(sub)는 고정 규격이라 드래그 리사이즈를 잠근다. 이름 없는
    // 제너릭 폭(360/480/620/780/1080)만 자유롭게 드래그할 수 있다(CSS 가 참조).
    root.dataset.deviceLocked = d.sub ? "true" : "false";
    setActive(i);
    window.dispatchEvent(new Event("devicechange"));
  };

  // 직접 입력한 가로·세로(px)를 적용한다. 라운드/여백/펀치홀은 프리셋과 동일한
  // '폭 구간' 규칙을 따르고, 세로는 입력값 그대로 쓴다. 프리셋 강조는 해제.
  const applyCustom = () => {
    const root = document.documentElement;
    let w = Math.round(parseFloat(customW));
    let h = Math.round(parseFloat(customH));
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
    // 최소 가로 300(드래그와 동일), 세로 240.
    w = Math.min(3000, Math.max(300, w));
    h = Math.min(3000, Math.max(240, h));
    const r = w < 480 ? 45 : w < 750 ? 29 : 13;
    const m = w >= 1080 ? 30 : 10;
    // 가로 모드면 입력값도 눕혀서 적용한다(프리셋과 같은 규칙).
    const land = root.dataset.landscape === "true";
    root.style.setProperty("--device-w", `${land ? h : w}px`);
    root.style.setProperty("--device-h", `${land ? w : h}px`);
    root.style.setProperty("--device-radius", `${r}px`);
    root.style.setProperty("--device-margin", `${m}px`);
    root.dataset.punch =
      w >= 1080 ? "trifold" : w >= 864 ? "fold8" : "center";
    // 직접 입력(커스텀)은 자유 규격이라 드래그 허용.
    root.dataset.deviceLocked = "false";
    setActive(-1);
    window.dispatchEvent(new Event("devicechange"));
  };

  // 왼쪽으로 회전 — 디바이스(베젤+화면)를 시계반대 90°로 '제자리에서' 돌린다.
  //
  // 돌기만 하면 안의 콘텐츠까지 같이 누워 글자를 옆으로 읽어야 한다. 그래서 각도
  // 애니메이션이 끝나는 순간, 무이동으로(트랜지션 꺼짐) 각도를 0 으로 되돌리면서
  // 기기 크기(--device-w/h)를 눕힌 값으로 맞바꾼다. 세로 박스를 -90° 돌린
  // footprint 와 눕힌 박스의 footprint 가 같아서 화면상 위치·크기는 안 튀고,
  // 앱만 가로 폭 기준으로 다시 배치돼 콘텐츠가 똑바로 선다.
  //
  // --device-rot-w/h 는 그 계산의 기준이 되는 '세로 크기'다. 회전 중에는 고정 —
  // 중심 계산이 같이 바뀌면 갈아끼우는 순간 프레임이 뛴다(globals.css 참고).
  //
  // 중심은 세로·가로가 같아야 한다(사용자 결정) — 각도만 돌리고 이동은 섞지 않는다.
  // 가로가 됐을 때 좌측 패널 밑으로 깔리던 건 여기서 밀어 때우지 않고, 기기를
  // 애초에 패널 오른쪽 영역 가운데에 놓아서 푼다(DeviceScaler.setAnchor).
  const rotFirst = useRef(true);
  useEffect(() => {
    const root = document.documentElement;
    if (rotFirst.current) {
      rotFirst.current = false;
      root.dataset.rotate = "false";
      root.dataset.landscape = "false";
      root.style.setProperty("--device-rot", "0deg");
      // 상단 바 색을 세로(흰 앱 배경) 기준으로 못 박아 둔다.
      setBarColor(false);
      return;
    }
    const cs = getComputedStyle(root);
    const w = parseFloat(cs.getPropertyValue("--device-w")) || 360;
    const h = parseFloat(cs.getPropertyValue("--device-h")) || 780;

    // 무이동 스위치 — 트랜지션을 끄고 값을 바꾼 뒤, 강제 리플로로 그 상태를 확정하고
    // 다시 켠다. 예전엔 requestAnimationFrame 두 번으로 기다렸는데, 탭이 화면에
    // 안 보이면(visibilityState=hidden) rAF 가 아예 안 불려서 회전이 중간 상태로
    // 멈춰 있었다. 리플로는 보이든 안 보이든 그 자리에서 끝난다.
    const still = (mutate: () => void) => {
      root.dataset.rotating = "true";
      mutate();
      void root.offsetHeight; // 스타일 플러시
      root.dataset.rotating = "false";
    };

    // 세로 기준 크기(pw×ph). 회전축은 '세로 상태의 디바이스 중심' 하나로 고정하고,
    // 가로로 있는 동안에도 그 중심 기준 배치(data-rotate)를 유지한다. 끝에서
    // 흐름 배치(왼쪽·바닥 앵커)로 되돌리면 그 순간 중심이 옮겨져 프레임이 튄다.
    const pw = rotated ? w : h; // 세로 폭
    const ph = rotated ? h : w; // 세로 높이

    if (rotated) {
      // 세로 → 가로.
      root.style.setProperty("--device-rot-w", `${pw}px`);
      root.style.setProperty("--device-rot-h", `${ph}px`);
      // 1) flex → fixed 무이동 스위치(각도 0 = 세로와 똑같이 보임)
      still(() => {
        root.dataset.rotate = "true";
        root.style.setProperty("--device-rot", "0deg");
      });
      window.dispatchEvent(new Event("devicechange"));
      // 2) 각도 -90° + 앵커 보정을 같은 트랜지션으로 → 돌면서 세로 때와 같은
      //    왼쪽·바닥 자리로 들어온다(보정 없이 돌면 왼쪽 패널 밑으로 깔린다).
      root.style.setProperty("--device-rot", "-90deg");
      // 3) 회전이 끝나면 각도를 0 으로 되돌리며 크기를 눕힌다 — 콘텐츠가 선다.
      //    세로 박스를 -90° 돌린 footprint 와 눕힌 박스의 footprint 가 같은 자리라
      //    무이동으로 갈아끼워도 안 튄다.
      const t = setTimeout(() => {
        still(() => {
          root.style.setProperty("--device-w", `${ph}px`);
          root.style.setProperty("--device-h", `${pw}px`);
          root.style.setProperty("--device-rot", "0deg");
          root.dataset.landscape = "true";
          // 가로는 영상만 남는 검정 화면 — 상단 바도 검정으로.
          setBarColor(true);
        });
        window.dispatchEvent(new Event("devicechange"));
        window.dispatchEvent(new Event(LANDSCAPE_EVENT));
      }, 360);
      return () => clearTimeout(t);
    }

    // 가로 → 세로. 먼저 '지금 화면 그대로'를 각도 -90° 로 표현한 뒤(크기는 세로로
    // 되돌리고), 각도만 0 으로 되돌려 같은 중심에서 세운다.
    still(() => {
      root.style.setProperty("--device-w", `${pw}px`);
      root.style.setProperty("--device-h", `${ph}px`);
      root.style.setProperty("--device-rot", "-90deg");
      // 보정은 아직 가로 값 그대로 — '지금 가로 자리'를 세로 크기+(-90°)로 바꿔
      // 적은 것이라 여기서 0 으로 되돌리면 그 순간 프레임이 뛴다.
      root.dataset.landscape = "false";
      // 세로로 돌아오면 흰 앱 배경에 맞춰 상단 바도 다시 흰색으로. 이걸 안 하면
      // 사파리가 가로에서 잡은 검정을 그대로 물고 있어 상태바가 검게 남는다.
      setBarColor(false);
    });
    window.dispatchEvent(new Event("devicechange"));
    window.dispatchEvent(new Event(LANDSCAPE_EVENT));
    root.style.setProperty("--device-rot", "0deg");
    // 각도가 0 이 되면 fixed → flex 로 무이동 복귀(세로는 두 배치의 자리가 같다).
    const t = setTimeout(() => {
      still(() => {
        root.dataset.rotate = "false";
      });
      window.dispatchEvent(new Event("devicechange"));
    }, 360);
    return () => clearTimeout(t);
  }, [rotated]);

  // 안들의 딤에 있는 '화면 전환' 버튼 — 이 토글을 누른 것과 똑같이 동작시킨다.
  // 회전 연출은 위 effect 하나가 전부 담당하므로 여기선 상태만 뒤집는다.
  useEffect(() => {
    // 목표값이 실려 오면 그 값으로 맞춘다(축소 등). 없으면 예전처럼 뒤집는다.
    const onRotate = (e: Event) => {
      const to = (e as CustomEvent<{ to?: boolean }>).detail?.to;
      setRotated((v) => (typeof to === "boolean" ? to : !v));
    };
    window.addEventListener(DEVICE_ROTATE_EVENT, onRotate);
    return () => window.removeEventListener(DEVICE_ROTATE_EVENT, onRotate);
  }, []);

  // 입력한 가로:세로의 약분 비율(정수비 미리보기용).
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const customRatio = (() => {
    const w = Math.round(parseFloat(customW));
    const h = Math.round(parseFloat(customH));
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
      return "";
    const g = gcd(w, h);
    return `${w / g} : ${h / g}`;
  })();

  // 현재 패널 폭을 문서 루트에 노출한다. 데스크톱에서 기기를 "패널을 뺀 영역"
  // 기준 중앙에 배치하는 데 쓰인다(펼침 200px / 접힘 64px, CSS 와 동일).
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--panel-w",
      open ? "200px" : "64px",
    );
    // 가용 폭이 바뀌므로 배율을 다시 계산하게 한다.
    window.dispatchEvent(new Event("devicechange"));
  }, [open]);

  // 최초 마운트 시 기본 프리셋(Galaxy S25 · 360) 적용.
  useEffect(() => {
    applyPreset(DEFAULT_PRESET);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 자유 드래그 중엔 현재 폭이 속한 해상도 '범위' 프리셋을 강조 표시한다.
  // (크기는 DeviceResizer 가 직접 관리하고, 여기선 강조 인덱스만 갱신)
  useEffect(() => {
    const onRange = (e: Event) => {
      const i = (e as CustomEvent<number>).detail;
      if (typeof i === "number") setActive(i);
    };
    window.addEventListener("devicerange", onRange);
    return () => window.removeEventListener("devicerange", onRange);
  }, []);

  // 기기 위 칩 줄 맨 끝에 붙는 해상도 드롭다운.
  //   slot 0 = 오른쪽 시안(좌측 패널 '해상도' 목록과 같은 것을 고른다)
  //   slot 1·2 = 왼쪽 비교 자리 — '시안과 같음'이 기본이고, 고르면 그 자리만
  //              떨어져 나온다(사용자 요청 2026-08-25: 비교하기에서 해상도도 선택).
  // 칩으로 늘어놓지 않는 이유는 globals.css 의 .dpc-select 주석 참고(줄이 겹친다).
  const sizeSelect = (slot: 0 | CompareSlot) => {
    const value =
      slot === 0
        ? active
        : slot === 1
          ? size1
          : slot === 2
            ? size2
            : size3;
    return (
      // 닫힌 상태에 보이는 건 짧은 이름(칩)뿐이라 툴팁으로 전체 이름을 준다.
      <select
        className="dpc-select"
        data-pinned={slot !== 0 && value >= 0}
        title={value >= 0 ? `해상도 · ${presetName(DEVICES[value])}` : "해상도"}
        aria-label="해상도"
        value={String(value)}
        onChange={(e) => {
          const i = Number(e.target.value);
          if (slot === 0) applyPreset(i);
          else requestCompareSize(slot, i);
        }}
      >
        {slot === 0 ? (
          // 시안 쪽은 드래그로 크기를 바꾸면 프리셋 강조가 풀린다(active = -1).
          // 그때만 '직접'을 보여 준다 — 고를 수 있는 값이 아니라 현재 상태다.
          active < 0 && <option value="-1">직접</option>
        ) : (
          <option value="-1">같음</option>
        )}
        {/* 이름은 상단 칩 줄용 짧은 이름(chip)을 쓴다. 좌측 패널의 긴 라벨을
            그대로 넣으면 드롭다운이 넓어져 칩 줄이 한 줄 더 접히고, 그만큼
            아래로 내려와 기기 목업 위를 덮는다(위쪽 여유는 92px 뿐). */}
        {DEVICES.map((d, i) => (
          <option key={i} value={i}>
            {d.chip}
          </option>
        ))}
      </select>
    );
  };

  return (
    <nav
      className="desktop-variant-nav"
      data-open={open}
      aria-label="화면안 이동"
    >
      {/* 화면 시안 칩 줄 — 치수 눈금자 위, 화면 상단 가운데. 좌측 패널의
          '화면 시안' 목록과 같은 것을 고르지만, 안을 바꿔 가며 볼 때 패널까지
          시선을 옮기지 않아도 되게 기기 바로 위에 둔다(사용자 요청).
          두 곳이 같은 requestVariant 를 쓰므로 어느 쪽으로 골라도 강조가 같이
          움직인다. nav 는 transform 이 없어서 fixed 자식이 overflow:hidden 에
          안 잘린다. */}
      {/* 시안 칩 — 오른쪽(지금 보고 있는 안) 기기 위. */}
      <div className="device-preset-chips dpc-right">
        <button
          type="button"
          className="dpc-chip"
          data-active={asisOnly}
          onClick={() => {
            setAsisOnly(true);
            setCompare(false);
          }}
        >
          As Is
        </button>
        {VARIANTS.map((v) => (
          <button
            key={v.key}
            type="button"
            className="dpc-chip"
            data-active={!asisOnly && variant === v.key}
            onClick={() => {
              setAsisOnly(false);
              requestVariant(v.key);
            }}
          >
            {VARIANT_LABEL[v.key]}
          </button>
        ))}
        {/* 비교하기일 때만 시안 쪽에도 해상도를 붙인다 — 세 기기의 해상도를
            한 줄 눈높이에서 고르라고. 한 대만 볼 때는 좌측 패널 목록이 그 자리다. */}
        {compare && sizeSelect(0)}
      </div>

      {/* 비교 대상 칩 — 왼쪽 기기 위. 각 칩 줄이 자기 기기 바로 위에 있어야
          어느 쪽을 고르는 건지 바로 읽힌다(사용자 요청).
          목록은 항상 전부 띄운다 — 예전엔 다른 자리에 이미 선 것(오른쪽 시안
          포함)을 뺐는데, 고를 수 있는 게 자리마다 달라 칩 줄이 들쭉날쭉했다.
          같은 안을 두 자리에 놓는 것도 사용자 선택으로 둔다(2026-08-24). */}
      {compare &&
        COMPARE_SLOTS.filter((slot) => slot <= compareCount - 1).map((slot) => {
            const picked =
              slot === 1
                ? compareWith
                : slot === 2
                  ? compareWith2
                  : compareWith3;
            return (
              <div
                key={slot}
                className={`device-preset-chips ${slot === 1 ? "dpc-left" : `dpc-left${slot}`}`}
              >
                {COMPARE_TARGETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="dpc-chip"
                    data-active={picked === t}
                    onClick={() => requestCompareTarget(t, slot)}
                  >
                    {t === "asis" ? "As Is" : VARIANT_LABEL[t]}
                  </button>
                ))}
                {sizeSelect(slot)}
              </div>
            );
          })}
      <button
        type="button"
        className="dvn-toggle"
        aria-expanded={open}
        aria-label={open ? "메뉴 접기" : "메뉴 펼치기"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dvn-icon dvn-toggle-icon" aria-hidden>
          {open ? "‹" : "☰"}
        </span>
        <span className="dvn-label">메뉴</span>
      </button>

      {/* 저장 방식 — 영상이 NVR(로컬 녹화기)에 있느냐 클라우드에 있느냐.
          '화면 시안'보다 위다: 어느 안을 볼지보다 먼저 정하는 전제라서. */}
      <p className="dvn-group-title dvn-label">저장 방식</p>
      <div className="dvn-seg" role="group" aria-label="저장 방식">
        {STORAGE_MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            className="dvn-seg-btn"
            data-active={storage === m.key}
            aria-pressed={storage === m.key}
            title={m.label}
            onClick={() => requestStorageMode(m.key)}
          >
            <span className="dvn-icon" aria-hidden>
              {m.token}
            </span>
            <span className="dvn-label">{m.label}</span>
          </button>
        ))}
      </div>

      <p className="dvn-group-title dvn-label">화면 시안</p>
      <ul className="dvn-list">
        {/* As Is — 현행 앱 재현. 고르면 시안 대신 이것만 뜬다(비교하기와 다름). */}
        <li>
          <button
            type="button"
            data-active={asisOnly}
            title="As Is (현행 앱)"
            onClick={() => {
              setAsisOnly(true);
              setCompare(false);
            }}
          >
            <span className="dvn-icon" aria-hidden>
              현행
            </span>
            <span className="dvn-label">As Is</span>
          </button>
        </li>
        {VARIANTS.map((v) => (
          <li key={v.key}>
            <button
              type="button"
              data-active={!asisOnly && variant === v.key}
              title={VARIANT_LABEL[v.key]}
              // URL 을 안 건드리고 안만 갈아끼운다 — 안 화면의 시안 목록 시트와
              // 같은 경로다(variantRoute.ts). platform·chrome 쿼리도 그대로 남는다.
              onClick={() => {
                setAsisOnly(false);
                requestVariant(v.key);
              }}
            >
              <span className="dvn-icon" aria-hidden>
                {v.icon}
              </span>
              <span className="dvn-label">{VARIANT_LABEL[v.key]}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="dvn-group-title dvn-label">해상도</p>
      <ul className="dvn-list">
        {DEVICES.map((d, i) => (
          <li key={`${d.w}-${d.sub}`}>
            <button
              type="button"
              data-active={active === i}
              title={`${d.label}${d.sub ? ` · ${d.sub}` : ""}`}
              onClick={() => applyPreset(i)}
            >
              <span className="dvn-icon dvn-icon-num" aria-hidden>
                {d.w}
              </span>
              {/* 표시 기준은 실기기 크기(mm)다 — 몸체 폭을 아는 프리셋은 그걸
                  앞에 세우고, 뷰포트(가로×세로)는 기기마다 따로 뒤에 적는다
                  (사용자 지정 2026-09-04: "표시 기준은 실제 값으로 하고, 뷰포트는
                  각 디바이스별로 따로 표시"). 둘은 서로 환산되지 않는다 —
                  1 CSS px 의 물리 길이가 기기마다 달라서다.
                  mm 를 모르는 제너릭 폭은 예전처럼 뷰포트+비율만 적는다. */}
              <span className="dvn-label">
                {presetSize(d) ? (
                  <>
                    {d.sub || d.label}
                    <span className="dvn-sub">{`${presetSize(d)} · ${d.w}×${d.h}`}</span>
                  </>
                ) : (
                  `${d.label}(${ratioText(d.w, d.h)})${d.sub ? ` · ${d.sub}` : ""}`
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* 직접 입력 — 가로·세로(px)로 커스텀 해상도. 비율은 아래에 미리보기. */}
      <div className="dvn-custom">
        <div className="dvn-custom-row">
          <input
            type="number"
            className="dvn-custom-input"
            placeholder="가로"
            aria-label="가로(px)"
            value={customW}
            onChange={(e) => setCustomW(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCustom();
            }}
          />
          <span className="dvn-custom-x" aria-hidden>
            ×
          </span>
          <input
            type="number"
            className="dvn-custom-input"
            placeholder="세로"
            aria-label="세로(px)"
            value={customH}
            onChange={(e) => setCustomH(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCustom();
            }}
          />
          <button
            type="button"
            className="dvn-custom-apply"
            onClick={applyCustom}
          >
            적용
          </button>
        </div>
        <p className="dvn-custom-ratio">
          {customRatio ? `비율 ${customRatio}` : "가로 × 세로 입력"}
        </p>
      </div>

      {/* 왼쪽으로 회전 — 디바이스를 시계반대 90° 시각적으로 회전(가로).
          확대 중에도 누를 수 있다. 한동안 막아 뒀었는데(도는 동안 콘텐츠까지
          같이 바뀌어 화면이 튀었다), 지금은 도는 동안 안이 전환 스켈레톤으로
          덮으므로 튀지 않는다. 다만 '확대를 유지한 채 회전'은 아니다 — 확대는
          끄고 방향만 한 번 바꾼다(아래 onClick). */}
      <button
        type="button"
        className="dvn-rotate-toggle"
        data-active={rotated}
        title={
          immersive
            ? "확대를 끄고 방향 전환"
            : rotated
              ? "세로로 되돌리기"
              : "왼쪽으로 회전"
        }
        onClick={() => {
          // 확대 중이면 '확대를 끄고 방향을 한 번만 바꾼다'. 확대 화면인 채로
          // 프레임만 돌면 돌고 나서 콘텐츠가 다시 서느라 두 번 도는 것처럼
          // 보이기 때문 — 도는 동안은 안(VariantA1)이 스켈레톤으로 덮는다.
          //
          // 방향 복귀는 exitImmersive 하나가 맡는다 — 지금은 무조건 '세로로'
          // 목표값(to=false)을 실어 보내므로 여기서 또 돌리면 안 된다. 예전엔
          // 제자리 확대만 여기서 한 번 돌렸는데(그땐 exitImmersive 가 조건부라),
          // 그 보정이 남은 채 exitImmersive 가 무조건이 되면서 두 번 뒤집혀
          // '가로 유지 + 확대만 꺼짐'이 됐다(사용자 지적: "왼쪽 회전된 상태에서
          // 축소로 되어 있니"). 이미 세로면 to=false 는 아무 일도 안 한다.
          if (readImmersive()) {
            exitImmersive();
            return;
          }
          setRotated((v) => !v);
        }}
      >
        <span className="dvn-icon" aria-hidden>
          ⟲
        </span>
        <span className="dvn-label">왼쪽으로 회전</span>
      </button>

      {/* 맨 하단: 배율 1:1 고정 토글. 누르면 실제 사이즈, 다시 누르면 자동 맞춤. */}
      <button
        type="button"
        className="dvn-actual-toggle"
        data-active={actualSize}
        title={actualSize ? "되돌리기" : "실제 사이즈로 보기"}
        onClick={() => setActualSize((v) => !v)}
      >
        <span className="dvn-icon" aria-hidden>
          {actualSize ? "↺" : "1:1"}
        </span>
        <span className="dvn-label">
          {actualSize ? "되돌리기" : "실제 사이즈로 보기"}
        </span>
      </button>

      {/* PNG 저장 — 지금 보고 있는 화면을 앱 프레임 원본 크기로 받는다.
          비교하기가 켜져 있으면 나란히 선 기기들을 한 장으로 이어 붙인다
          (사용자 요청 2026-08-26). 자세한 규칙은 captureShot.ts. */}
      <button
        type="button"
        className="dvn-actual-toggle"
        data-active={shooting}
        disabled={shooting}
        title={shooting ? "PNG 만드는 중…" : "PNG 로 저장"}
        onClick={async () => {
          setShooting(true);
          try {
            await downloadShot();
          } finally {
            setShooting(false);
          }
        }}
      >
        <span className="dvn-icon" aria-hidden>
          {shooting ? "…" : "PNG"}
        </span>
        <span className="dvn-label">
          {shooting ? "만드는 중…" : "PNG 로 저장"}
        </span>
      </button>

      {/* 비교하기: 시안 왼쪽에 하나를 더 나란히 놓는다(기본 As Is). */}
      <button
        type="button"
        className="dvn-compare-toggle"
        data-active={compare}
        title={compare ? "비교 닫기" : "비교하기"}
        onClick={() => {
          // 켤 때는 'As Is 단독'을 푼다. 둘은 다른 모드인데(단독은 시안 자리에
          // As Is 하나, 비교는 시안 + 왼쪽 기기들) 같이 켜져 있으면 시안이 숨은
          // 채 비교 기기만 남아 자리가 어긋난다.
          const next = !compare;
          setCompare(next);
          if (next) setAsisOnly(false);
        }}
      >
        <span className="dvn-icon" aria-hidden>
          ⇆
        </span>
        <span className="dvn-label">비교하기</span>
      </button>
      {/* 몇 개를 나란히 볼지 — 비교하기를 켰을 때만. 저장 방식과 같은 세그먼트
          룩이라 접힘(64px) 레일에서도 숫자만으로 읽힌다. */}
      {compare && (
        <div className="dvn-seg" role="group" aria-label="비교 개수">
          {COMPARE_COUNTS.map((c) => (
            <button
              key={c.n}
              type="button"
              className="dvn-seg-btn"
              data-active={compareCount === c.n}
              aria-pressed={compareCount === c.n}
              title={`${c.label} 비교`}
              onClick={() => setCompareCount(c.n)}
            >
              <span className="dvn-icon" aria-hidden>
                {c.token}
              </span>
              <span className="dvn-label">{c.label}</span>
            </button>
          ))}
        </div>
      )}


      {/* 목업 위 치수 눈금자 표시 온/오프. */}
      <label className="dvn-ruler-toggle" title="치수 표시">
        <span className="dvn-icon">
          <input
            type="checkbox"
            checked={showRuler}
            onChange={(e) => setShowRuler(e.target.checked)}
          />
        </span>
        <span className="dvn-label">치수 표시</span>
      </label>
    </nav>
  );
}
