"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// 데스크톱 전용: 화면 왼쪽 가장자리에 붙는 LNB 패널(좌측 레일).
// 접으면 각 메뉴의 아이콘만, 펼치면 아이콘+메뉴명이 보인다.
// 두 그룹 — 화면안(A/B) + 해상도(디바이스 폭) 선택.
// 모바일/터치에선 CSS(.desktop-variant-nav)로 숨긴다.
const VARIANTS = [
  { href: "/a", icon: "A", label: "A안" },
  { href: "/a1", icon: "A-1", label: "A-1안" },
  { href: "/b", icon: "B", label: "B안" },
];

// 선택 가능한 디바이스 폭. w/h 는 앱 프레임(px), 목업은 사방 10px 크게 잡힌다.
// r = 바깥 베젤 라운드(px). 360 은 SVG 목업 rx=45 에 맞춘 값.
// m = 베젤과 화면 사이 사방 간격(px). 1080 만 30, 나머지는 10.
const DEVICES = [
  { w: 360, h: 780, r: 45, m: 10, label: "360px", sub: "Galaxy S25" },
  { w: 480, h: 780, r: 29, m: 10, label: "480px", sub: "" },
  { w: 620, h: 780, r: 29, m: 10, label: "620px", sub: "" },
  { w: 750, h: 832, r: 13, m: 10, label: "750px", sub: "Z Fold 7" },
  { w: 823, h: 590, r: 13, m: 10, label: "823px", sub: "Z Fold 8" },
  { w: 1080, h: 792, r: 13, m: 30, label: "1080px", sub: "Z TriFold" },
];

export default function DesktopVariantNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(0); // 강조 표시할 DEVICES 인덱스(범위)
  const [showRuler, setShowRuler] = useState(true); // 목업 위 치수 눈금자 표시 여부
  const [actualSize, setActualSize] = useState(false); // 배율 1:1 고정 여부
  const [compare, setCompare] = useState(false); // As Is(현재 앱) 나란히 비교 여부
  const [rotated, setRotated] = useState(false); // 디바이스 시각적 90° 회전(가로)
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
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("compare") === "1") {
      setCompare(true);
    }
  }, []);

  // 비교하기(As Is 나란히) 여부를 문서 루트에 반영한다(AsIsPanel 이 구독).
  useEffect(() => {
    document.documentElement.dataset.compare = compare ? "true" : "false";
    window.dispatchEvent(new Event("comparechange"));
  }, [compare]);

  // 프리셋 크기를 문서 루트에 반영하고 강조 인덱스를 맞춘다.
  const applyPreset = (i: number) => {
    const d = DEVICES[i];
    const root = document.documentElement;
    root.style.setProperty("--device-w", `${d.w}px`);
    root.style.setProperty("--device-h", `${d.h}px`);
    root.style.setProperty("--device-radius", `${d.r}px`);
    root.style.setProperty("--device-margin", `${d.m}px`);
    // 펀치홀 카메라 위치 — 실기기처럼 기기별로 다르다(CSS 가 참조).
    // 트라이폴드(1080): 오른쪽 / Fold 8(823): 왼쪽 열 영상 중앙 / 그 외: 상단 중앙.
    root.dataset.punch =
      d.w >= 1080 ? "trifold" : d.w >= 823 ? "fold8" : "center";
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
    root.style.setProperty("--device-w", `${w}px`);
    root.style.setProperty("--device-h", `${h}px`);
    root.style.setProperty("--device-radius", `${r}px`);
    root.style.setProperty("--device-margin", `${m}px`);
    root.dataset.punch =
      w >= 1080 ? "trifold" : w >= 823 ? "fold8" : "center";
    setActive(-1);
    window.dispatchEvent(new Event("devicechange"));
  };

  // 왼쪽으로 회전 — 디바이스(베젤+화면)를 시계반대 90° 시각적으로 회전한다.
  // 해상도(가로·세로)는 그대로 두고 화면만 눕힌다(가로 모드). 다시 누르면 원위치.
  useEffect(() => {
    document.documentElement.dataset.rotate = rotated ? "true" : "false";
    window.dispatchEvent(new Event("devicechange"));
  }, [rotated]);

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

  // 최초 마운트 시 기본 프리셋(360) 적용.
  useEffect(() => {
    applyPreset(0);
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
          <li key={v.href}>
            <button
              type="button"
              data-active={pathname === v.href}
              title={v.label}
              onClick={() => {
                // 현재 platform·chrome 쿼리를 유지한 채 해당 안으로 이동.
                const sp = new URLSearchParams(window.location.search);
                const platform =
                  sp.get("platform") === "ios" ? "ios" : "android";
                const chrome = sp.get("chrome") === "1";
                router.push(
                  `${v.href}?platform=${platform}${chrome ? "&chrome=1" : ""}`,
                );
              }}
            >
              <span className="dvn-icon" aria-hidden>
                {v.icon}
              </span>
              <span className="dvn-label">{v.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="dvn-group-title dvn-label">해상도</p>
      <ul className="dvn-list">
        {DEVICES.map((d, i) => (
          <li key={d.w}>
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
                {d.label}
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

      {/* 왼쪽으로 회전 — 디바이스를 시계반대 90° 시각적으로 회전(가로). */}
      <button
        type="button"
        className="dvn-rotate-toggle"
        data-active={rotated}
        title={rotated ? "세로로 되돌리기" : "왼쪽으로 회전"}
        onClick={() => setRotated((v) => !v)}
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
