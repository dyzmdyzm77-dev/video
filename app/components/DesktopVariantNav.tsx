"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// 데스크톱 전용: 화면 왼쪽 가장자리에 붙는 LNB 패널(좌측 레일).
// 접으면 각 메뉴의 아이콘만, 펼치면 아이콘+메뉴명이 보인다.
// 두 그룹 — 화면안(A/B/C) + 해상도(디바이스 폭) 선택.
// 모바일/터치에선 CSS(.desktop-variant-nav)로 숨긴다.
const VARIANTS = [
  { href: "/a", icon: "A", label: "A안" },
  { href: "/b", icon: "B", label: "B안" },
  { href: "/c", icon: "C", label: "C안" },
];

// 선택 가능한 디바이스 폭. w/h 는 앱 프레임(px), 목업은 사방 10px 크게 잡힌다.
// r = 바깥 베젤 라운드(px). 360 은 SVG 목업 rx=45 에 맞춘 값.
// m = 베젤과 화면 사이 사방 간격(px). 1080 만 30, 나머지는 10.
const DEVICES = [
  { w: 360, h: 780, r: 45, m: 10, label: "360px", sub: "Galaxy S25" },
  { w: 480, h: 860, r: 29, m: 10, label: "480px", sub: "" },
  { w: 620, h: 900, r: 29, m: 10, label: "620px", sub: "" },
  { w: 750, h: 840, r: 13, m: 10, label: "750px", sub: "Z Fold 7" },
  { w: 1080, h: 900, r: 13, m: 30, label: "1080px", sub: "Z TriFold" },
];

export default function DesktopVariantNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(0); // 강조 표시할 DEVICES 인덱스(범위)

  // 프리셋 크기를 문서 루트에 반영하고 강조 인덱스를 맞춘다.
  const applyPreset = (i: number) => {
    const d = DEVICES[i];
    const root = document.documentElement;
    root.style.setProperty("--device-w", `${d.w}px`);
    root.style.setProperty("--device-h", `${d.h}px`);
    root.style.setProperty("--device-radius", `${d.r}px`);
    root.style.setProperty("--device-margin", `${d.m}px`);
    root.dataset.deviceKind = d.w <= 360 ? "phone" : "wide";
    setActive(i);
    window.dispatchEvent(new Event("devicechange"));
  };

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
    </nav>
  );
}
