"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { EVENT_THUMBS_EVENT } from "./eventThumbs";
import {
  exitImmersive,
  readImmersive,
  readImmersiveRotated,
} from "./immersive";
import {
  DEVICE_ROTATE_EVENT,
  LANDSCAPE_EVENT,
  setBarColor,
} from "./deviceRotate";
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
  { key: "b", icon: "B" },
];

// 선택 가능한 디바이스 폭. w/h 는 앱 프레임(px), 목업은 사방 10px 크게 잡힌다.
// r = 바깥 베젤 라운드(px). 360 은 SVG 목업 rx=45 에 맞춘 값.
// m = 베젤과 화면 사이 사방 간격(px). 1080 만 30, 나머지는 10.
// 이름 없는 폭(480/620)은 위, 실기기 이름이 붙은 것들은 아래에 디바이스별로
// 묶어서(같은 기기의 접힘/펼침은 인접) 배치한다.
const DEVICES = [
  { w: 360, h: 780, r: 45, m: 10, label: "360px", sub: "" },
  { w: 480, h: 780, r: 29, m: 10, label: "480px", sub: "" },
  { w: 620, h: 780, r: 29, m: 10, label: "620px", sub: "" },
  { w: 780, h: 780, r: 29, m: 10, label: "780px", sub: "" },
  { w: 1080, h: 780, r: 29, m: 10, label: "1080px", sub: "" },
  { w: 360, h: 780, r: 45, m: 10, label: "360px", sub: "Galaxy S26" },
  { w: 405, h: 648, r: 13, m: 10, label: "405px", sub: "Z Fold 8(접힘)" },
  { w: 864, h: 648, r: 13, m: 10, label: "864px", sub: "Z Fold 8(펼침)" },
  { w: 750, h: 832, r: 13, m: 10, label: "750px", sub: "Z Fold 8 울트라" },
  { w: 1080, h: 792, r: 13, m: 30, label: "1080px", sub: "Z TriFold" },
];
// 최초 표시 기본 프리셋 — 제너릭 360px(이름 없는 첫 항목).
const DEFAULT_PRESET = DEVICES.findIndex(
  (d) => d.label === "360px" && d.sub === "",
);

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
  return `${w / g}:${h / g}`;
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
  const [showRuler, setShowRuler] = useState(true); // 목업 위 치수 눈금자 표시 여부
  const [actualSize, setActualSize] = useState(false); // 배율 1:1 고정 여부
  const [compare, setCompare] = useState(false); // As Is(현재 앱) 나란히 비교 여부
  const [rotated, setRotated] = useState(false); // 디바이스 시각적 90° 회전(가로)
  // 움직임 감지 이벤트 카드에 썸네일을 쓸 수 있는 사양인지. 끄면 시각+타이틀만.
  const [eventThumbs, setEventThumbs] = useState(true);
  // 직접 입력(커스텀 해상도) — 가로·세로 px.
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

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
  // ?thumbs=0 이면 썸네일 없는 사양으로 시작한다 — 좌측 패널은 데스크톱 전용이라
  // 폰으로 미리보기를 열어 볼 땐 쿼리가 유일한 진입점이다.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("compare") === "1") setCompare(true);
    if (sp.get("thumbs") === "0") setEventThumbs(false);
  }, []);

  // 썸네일 지원 여부를 문서 루트에 반영한다(A·A-1 의 움직임 감지 타임라인이 구독).
  useEffect(() => {
    document.documentElement.dataset.eventThumbs = eventThumbs ? "true" : "false";
    window.dispatchEvent(new Event(EVENT_THUMBS_EVENT));
  }, [eventThumbs]);

  // 비교하기(As Is 나란히) 여부를 문서 루트에 반영한다(AsIsPanel 이 구독).
  useEffect(() => {
    document.documentElement.dataset.compare = compare ? "true" : "false";
    window.dispatchEvent(new Event("comparechange"));
  }, [compare]);

  // 프리셋 크기를 문서 루트에 반영하고 강조 인덱스를 맞춘다.
  const applyPreset = (i: number) => {
    const d = DEVICES[i];
    const root = document.documentElement;
    // 가로 모드면 프리셋도 눕혀서 적용한다 — 안 그러면 세로로 되돌아간다.
    const land = root.dataset.landscape === "true";
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
    const onRotate = () => setRotated((v) => !v);
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

  return (
    <nav
      className="desktop-variant-nav"
      data-open={open}
      aria-label="화면안 이동"
    >
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

      <p className="dvn-group-title dvn-label">화면 시안</p>
      <ul className="dvn-list">
        {VARIANTS.map((v) => (
          <li key={v.key}>
            <button
              type="button"
              data-active={variant === v.key}
              title={VARIANT_LABEL[v.key]}
              // URL 을 안 건드리고 안만 갈아끼운다 — 안 화면의 시안 목록 시트와
              // 같은 경로다(variantRoute.ts). platform·chrome 쿼리도 그대로 남는다.
              onClick={() => requestVariant(v.key)}
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
              <span className="dvn-label">
                {d.label}({ratioText(d.w, d.h)})
                {d.sub ? ` · ${d.sub}` : ""}
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
          확대 중에는 더 돌리지 않는다. 확대가 이미 눕혀 놓은 상태라 거기서 또
          돌리면 두 번 돈 꼴이 된다(사용자 결정: "눕힌 거는 이미 가로로 돌아간
          거랑 동일하니까 회전이 더 안 되게 해 … 원복하는 거랑"). 그래서 이때는
          확대를 풀고 원래 방향으로 되돌리기만 한다 — exitImmersive 가 확대하며
          눕힌 것이었으면 방향도 같이 원복한다. */}
      <button
        type="button"
        className="dvn-rotate-toggle"
        data-active={rotated}
        title={rotated ? "세로로 되돌리기" : "왼쪽으로 회전"}
        onClick={() => {
          // 확대 중 회전은 '확대를 끄고 방향을 한 번만 바꾼다'로 통일한다.
          // 확대 화면인 채로 프레임만 돌면, 프레임이 돌고 나서 안의 콘텐츠가
          // 다시 서느라 두 번 도는 것처럼 보인다(사용자 지적: "제자리 확대 →
          // 회전 → 두번 회전").
          //
          // 회전이 한 번만 나가도록 경로를 나눈다:
          //  · 확대가 눕혀 만든 상태 → exitImmersive 가 원래 방향으로 되돌린다.
          //  · 제자리 확대(750·780 처럼 눕혀도 안 커지는 기기) → 방향을 안 바꿨
          //    으므로 여기서 평소대로 한 번 돌린다.
          if (readImmersive()) {
            const undoesRotation = readImmersiveRotated();
            exitImmersive();
            if (!undoesRotation) setRotated((v) => !v);
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

      {/* 비교하기: 시안 왼쪽에 As Is(현재 앱) 영상 화면을 나란히. */}
      <button
        type="button"
        className="dvn-compare-toggle"
        data-active={compare}
        title={compare ? "비교 닫기" : "비교하기"}
        onClick={() => setCompare((v) => !v)}
      >
        <span className="dvn-icon" aria-hidden>
          ⇆
        </span>
        <span className="dvn-label">비교하기</span>
      </button>

      {/* 움직임 감지 썸네일 온/오프 — 썸네일을 못 뽑는 기기 사양 대응 화면 확인용.
          끄면 카드 자리에 시각 + "움직임 감지" 텍스트만 남는다(카드 크기는 동일). */}
      <label className="dvn-ruler-toggle" title="움직임 감지 썸네일">
        <span className="dvn-icon">
          <input
            type="checkbox"
            checked={eventThumbs}
            onChange={(e) => setEventThumbs(e.target.checked)}
          />
        </span>
        <span className="dvn-label">감지 썸네일</span>
      </label>

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
