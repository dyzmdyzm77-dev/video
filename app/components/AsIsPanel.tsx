"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BASE } from "../basePath";
import AndroidNav from "./AndroidNav";
import VariantA from "../_variants/VariantA";
import VariantA1 from "../_variants/VariantA1";
import VariantA3 from "../_variants/VariantA3";
import VariantB from "../_variants/VariantB";
import { useCompareTarget, type CompareSlot } from "./compareTarget";
import { punchForSlot, useCompareSize } from "./compareSize";
import { DeviceScopeContext } from "./deviceScope";
import { VARIANT_LABEL } from "./variantRoute";
import { CameraFeed } from "./CameraFeed";
import { useDeviceWidth } from "./useDeviceWidth";
import { Inner as HomeScreen } from "../home/page";

// 데스크톱 전용: "비교하기"를 켜면 현재 시안(가운데 기기) 왼쪽에 As Is(현재 앱)
// 영상 화면을 나란히 띄운다.
//
// 크기: 시안 기기와 항상 동일(--device-w/--device-h). 시안이 넓어지면 As Is 도
//   같이 넓어지고, 시안처럼 '리플로우' 한다 — 글자·아이콘 크기는 그대로,
//   영상 타일만 넓어진다(항상 16:9 유지). 카메라 목록은 세로 스크롤.
// 영상: 상단 큰 영상은 재생, 아래 카메라 목록 타일은 스틸(첫 프레임 — paused).
// 시스템 바: 상단 상태바·하단 안드로이드 네비 모두 시안과 동일한 것을 쓴다.
//
// 디자인 출처는 As Is SVG(9.3 실시간 영상(세로)). 고정 크기 SVG 로는 리플로우가
// 안 되므로 HTML 로 재구성하고, 아이콘만 원본 SVG 의 path 를 좌표 그대로 쓴다.

// 카메라 목록 타일 — 전부 영상(16:9). 원본의 회색 '에스원' 카드도 영상으로 대체.
const CAMS = [
  "cam1",
  "cam2",
  "cam3",
  "cam4",
  "cam1",
  "cam2",
  "cam3",
  "cam4",
];

// 실시간 날짜/시각 — As Is 고유 포맷("YYYY.MM.DD  HH:MM:SS", 요일 없음, 날짜와
// 시각 사이 공백 2칸). 시안(To Be)은 요일 포함 포맷을 쓰지만 As Is 는 원본 그대로.
// 화면 전환(다채널↔단일) 로딩 지속시간 — 스피너 한 바퀴(globals.css asis-spin
// 0.8s)와 맞춘다. 이 시간 동안 '현재 화면' 위에 스피너를 돌린 뒤 다음 화면으로
// 전환한다(로딩이 다 돌면 그때 전환).
const LOADING_MS = 800;

const pad = (n: number) => String(n).padStart(2, "0");
function formatAsIsClock(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---- 시안(VariantA)과 동일한 하단 탭 아이템 ----
function TabItem({
  iconSrc,
  label,
  active,
  onClick,
}: {
  iconSrc: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const iconColor = active ? "#1D6CEB" : "#C4C4C4";
  const textColor = active ? "#1D6CEB" : "#7F7F7F";
  return (
    <li
      onClick={onClick}
      className={`flex flex-col items-center gap-1${onClick ? " cursor-pointer" : ""}`}
    >
      <span
        aria-hidden
        className="block"
        style={{
          width: "32px",
          height: "32px",
          backgroundColor: iconColor,
          WebkitMaskImage: `url(${iconSrc})`,
          maskImage: `url(${iconSrc})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      <span
        className="text-[12px] font-semibold leading-none"
        style={{ color: textColor }}
      >
        {label}
      </span>
    </li>
  );
}

// ---- 원본 As Is SVG 에서 그대로 가져온 아이콘(viewBox 는 원본 360×996 좌표계) ----
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="73.5 496 32 32" className={className} aria-hidden>
      <path d="M86.4729 519.827C86.5603 519.828 86.647 519.811 86.7273 519.776C86.8077 519.742 86.88 519.691 86.9395 519.627L101.286 505.333L100.34 504.387L86.4729 518.213L78.6195 510.36L77.6729 511.307L86.0062 519.627C86.0667 519.69 86.1391 519.74 86.2193 519.774C86.2994 519.808 86.3857 519.826 86.4729 519.827Z" fill="currentColor" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="103.5 56 13 9" fill="none" className={className} aria-hidden>
      <path d="M114.25 58.375L110 62.625L105.75 58.375" stroke="currentColor" strokeLinecap="square" />
    </svg>
  );
}

// 바텀시트 토글 화살표 — 펼침(open)이면 ▼(눌러서 내림), 접힘이면 회전해 ▲(눌러서 올림).
function SheetArrow({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        transition: "transform 0.2s",
        transform: open ? "rotate(0deg)" : "rotate(180deg)",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ---- 시안(VariantA)과 동일한 상태바 아이콘 ----
function MuteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 4C7.5 4 3.5 5.7.5 8.4l2 2.3C5 8.5 8.3 7 12 7s7 1.5 9.5 3.7l2-2.3C20.5 5.7 16.5 4 12 4zm0 5c-3 0-5.7 1.1-7.8 3l2 2.3C7.8 12.9 9.8 12 12 12s4.2.9 5.8 2.3l2-2.3C17.7 10.1 15 9 12 9zm0 5c-1.5 0-2.9.6-4 1.5l4 4.5 4-4.5c-1.1-.9-2.5-1.5-4-1.5z" />
    </svg>
  );
}

function DndIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" strokeLinecap="round" />
    </svg>
  );
}

function BatteryIcon({ className, level }: { className?: string; level: number }) {
  return (
    <div className={`relative flex items-center justify-center rounded-[4px] bg-neutral-800 text-[8px] font-bold leading-none text-white ${className ?? ""}`}>
      {level}
    </div>
  );
}

// 자리 안쪽 트리는 '자기가 어느 기기에 그려지는지'를 컨텍스트로 물려받는다.
// 크기는 CSS 가 갈라 주지만(globals.css 의 html[data-compare] .asis-frame),
// 폭을 읽어 배치를 정하는 훅(useDeviceWidth 등)은 번호를 알아야 자기 자리
// 변수를 본다 — 안 그러면 시안 폭 기준으로 배치를 계산한다(deviceScope.ts).
export default function AsIsPanel({ slot = 1 }: { slot?: CompareSlot }) {
  return (
    <DeviceScopeContext.Provider value={slot}>
      <AsIsPanelBody slot={slot} />
    </DeviceScopeContext.Provider>
  );
}

function AsIsPanelBody({ slot }: { slot: CompareSlot }) {
  const [on, setOn] = useState(false);
  // 비교하기로 켜진 건지(자리 해상도가 먹는 상태), As Is 단독인지 구분한다.
  const [compareOn, setCompareOn] = useState(false);
  // 이 자리에 못 박은 해상도(-1 = 시안과 같음). 펀치홀 위치가 기기마다 달라서
  // 프레임에 실어 준다 — 크기와 달리 CSS 변수로는 안 풀리는 값이다.
  const sizeIdx = useCompareSize(slot);
  // 왼쪽에 무엇을 놓을지 — 기본은 As Is, 시안끼리 비교할 수도 있다.
  // slot 1 = 시안 바로 왼쪽, slot 2 = 그 왼쪽(3개 비교일 때만 뜬다).
  const compareWith = useCompareTarget(slot);
  // 기본은 다채널(그리드, 시안과 동일) — 큰 영상 없이 목록 8개가 모두 재생된다.
  // 타일을 클릭하면 그 카메라가 큰 영상으로 올라오는 단일채널 모드로 전환되고,
  // 큰 영상을 더블클릭하면 다채널로 복귀한다(시안과 동일한 규칙).
  const [mode, setMode] = useState<"grid" | "single">("grid");
  // 단일채널 모드에서 큰 영상에 떠 있는 카메라 인덱스.
  const [featured, setFeatured] = useState(0);
  // 화면 전환(다채널↔단일) 로딩 — 시안은 스켈레톤 UI를 쓰지만, As Is(옛날 앱)는
  // 그냥 로딩 스피너가 뜬다(사양 차이). 600ms 로 시안 스켈레톤과 지속시간을
  // 맞춘다(VariantA 의 handleExpand/handleBack setTimeout 600).
  const [loading, setLoading] = useState(false);
  // 현재 mode/featured 를 이벤트 콜백(빈 deps)에서 최신값으로 읽기 위한 미러.
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const featuredRef = useRef(featured);
  featuredRef.current = featured;
  // 전환 대기 목표와 타이머 — 로딩이 다 돌면 이 목표를 커밋한다.
  const pendingRef = useRef<{ mode: "grid" | "single"; featured: number } | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 비교하기 켠 직후 '첫 동기화'는 스피너 없이 즉시 맞춘다(초기 상태 세팅이지
  // 사용자 전환이 아니므로). 비교하기가 꺼지면 다시 초기화.
  const syncedOnceRef = useRef(false);
  // 620px 이상에서만 단일채널 카메라 목록을 바텀시트(가로 목록)로 바꾼다.
  // 값이 layoutRules.ts 의 WIDE_BP 와 같지만 일부러 상수를 안 쓴다 — As Is 는 현행 앱
  // 재현(비교 기준)이라, 개선안 기준선을 옮겨도 여기는 따라오면 안 된다.
  const wide = useDeviceWidth() >= 620;
  // 바텀시트 펼침/접힘 — 기본 펼침(들어가면 가로 목록이 바로 보임).
  const [sheetOpen, setSheetOpen] = useState(true);
  // 실시간 시계 — 매초 갱신(시안 To Be 와 동일). 패널은 클라이언트에서만
  // 렌더되므로(비교하기 on 이 useEffect 로 켜짐) 초기값을 즉시 현재 시각으로
  // 둬도 하이드레이션 불일치가 없다.
  const [now, setNow] = useState<Date | null>(() =>
    typeof window === "undefined" ? null : new Date(),
  );

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // 시스템 바 표시(?chrome=1)·플랫폼은 시안과 동일한 쿼리를 그대로 따른다.
  const chromeVisible = params.get("chrome") === "1";
  const platform = params.get("platform") === "ios" ? "ios" : "android";
  const qs = `platform=${platform}${chromeVisible ? "&chrome=1" : ""}`;
  // 지금 어떤 화면인지 — 라우트를 그대로 따라간다(양방향 연동의 핵심).
  const isHome = pathname === "/home";
  const from = ["a", "a1", "a2", "a3", "b"].includes(params.get("from") ?? "")
    ? (params.get("from") as string)
    : "a1";

  useEffect(() => {
    const read = () => {
      // 비교하기(왼쪽 나란히) 또는 'As Is 단독'(화면 시안 목록에서 고른 경우).
      // 두 번째 자리는 '3개 비교'일 때만 뜬다 — As Is 단독은 기기가 한 대뿐이라
      // 여기에 해당하지 않는다.
      const root = document.documentElement;
      const isOn =
        slot === 2
          ? root.dataset.compare === "true" && root.dataset.compareSlots === "2"
          : root.dataset.compare === "true" ||
            root.dataset.asisOnly === "true";
      setOn(isOn);
      setCompareOn(root.dataset.compare === "true");
      // 비교하기가 꺼지면 '첫 동기화 즉시' 플래그를 되돌려, 다시 켰을 때
      // 초기 상태를 스피너 없이 맞춘다.
      if (!isOn) syncedOnceRef.current = false;
    };
    read();
    window.addEventListener("comparechange", read);
    window.addEventListener("asisonlychange", read);
    return () => {
      window.removeEventListener("comparechange", read);
      window.removeEventListener("asisonlychange", read);
    };
  }, [slot]);

  // 실시간 시계 — 매초 갱신.
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 화면 전환 — '현재 화면' 위에 스피너를 LOADING_MS 만큼(한 바퀴) 돌린 뒤
  // 목표 화면으로 커밋한다. instant=true 면(비교하기 켠 직후 첫 동기화) 즉시.
  // 전환 중 새 목표가 오면 마지막 목표로 갱신하고 타이머를 다시 건다.
  const commit = (m: "grid" | "single", f: number | null) => {
    if (f != null) setFeatured(f);
    setMode(m);
  };
  const transitionTo = (
    m: "grid" | "single",
    f: number | null,
    instant = false,
  ) => {
    // 이미 그 상태면 아무것도 하지 않는다(불필요한 스피너 방지).
    if (
      m === modeRef.current &&
      (m === "grid" || f == null || f === featuredRef.current)
    ) {
      return;
    }
    if (instant) {
      commit(m, f);
      return;
    }
    pendingRef.current = { mode: m, featured: f ?? featuredRef.current };
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const t = pendingRef.current;
      if (t) commit(t.mode, t.featured);
      setLoading(false);
      pendingRef.current = null;
      timerRef.current = null;
    }, LOADING_MS);
  };

  // 언마운트 시 타이머 정리.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  // 시안 쪽 다채널/단일 전환을 그대로 반영 — 비교하기가 꺼져 있어도 구독은
  // 계속 켜둬서(컴포넌트는 항상 마운트돼 있다), 나중에 켰을 때 최신 상태로
  // 시작한다.
  useEffect(() => {
    const onSync = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d || d.source !== "variant") return;
      // 첫 동기화(비교하기 켠 직후)는 즉시, 이후 전환은 로딩 후.
      const instant = !syncedOnceRef.current;
      syncedOnceRef.current = true;
      if (d.mode === "grid") transitionTo("grid", null, instant);
      else transitionTo("single", d.index, instant);
    };
    window.addEventListener("channel-sync", onSync);
    return () => window.removeEventListener("channel-sync", onSync);
    // transitionTo 는 refs/세터만 쓰므로 첫 렌더 클로저로 충분(의도적으로 빈 deps).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // As Is 쪽 전환도 시안에 알린다(양방향). 비교하기 켜져 있을 때만 — 꺼진 동안의
  // 내부 상태 변화로 시안을 억지로 흔들지 않는다.
  useEffect(() => {
    if (!on) return;
    window.dispatchEvent(
      new CustomEvent("channel-sync", {
        detail: { source: "asis", mode, index: featured },
      }),
    );
  }, [on, mode, featured]);

  if (!on) return null;

  // 왼쪽이 시안이면 그 안을 프레임 안에 그대로 띄운다. As Is 마크업 대신
  // 진짜 컴포넌트라, 오른쪽과 같은 화면 종류(다채널/단일·실시간/녹화)에서
  // 시작하고 딤·시트도 각자 독립으로 동작한다(screenState.ts).
  // 자리에 따라 왼쪽으로 한 칸(slot 1) 또는 두 칸(slot 2) 물러난다(globals.css).
  const frameClass = slot === 2 ? "asis-frame asis-frame--2" : "asis-frame";
  // 자리 해상도를 따로 정했을 때만 실어 준다. 안 정했으면 속성이 없어서 문서
  // 루트(html[data-punch])의 값을 그대로 쓴다. As Is 단독 보기는 시안 자리를
  // 그대로 쓰므로 자리 해상도를 적용하지 않는다(CSS 도 마찬가지).
  const punch = compareOn ? punchForSlot(sizeIdx) ?? undefined : undefined;

  if (compareWith !== "asis") {
    const Variant =
      compareWith === "a1"
        ? VariantA1
        : compareWith === "a2"
          ? VariantA
          : compareWith === "a3"
            ? VariantA3
            : VariantB;
    return (
      <div className={frameClass} data-punch={punch}>
        <span className="asis-caption">{VARIANT_LABEL[compareWith]}</span>
        <div className="asis-screen asis-variant">
          <Variant
            platform={platform}
            initialChrome={chromeVisible}
            inCompare
            compareSlot={slot}
          />
        </div>
      </div>
    );
  }

  // 카메라 목록 타일 하나 — 세로 2열 그리드와 620px+ 가로 바텀시트에서 공용.
  const renderTile = (cam: string, i: number) => (
    <div
      key={i}
      className={`asis-tile ${i % 2 === 0 ? "asis-tile--left" : "asis-tile--right"}`}
      onClick={() => {
        // 이미 단일 모드면 큰 영상만 즉시 교체(화면 전환 아님, 로딩 없음).
        // 다채널→단일은 로딩을 한 바퀴 돌린 뒤 전환한다.
        if (mode === "single") setFeatured(i);
        else transitionTo("single", i);
      }}
    >
      {/* 스크림·라벨·선택 오버레이는 타일(칸)이 아니라 실제 영상 영역(.asis-feed)
          기준으로 얹는다 — 레터박스(검정 여백)가 생겨도 라벨이 영상 위에 붙는다. */}
      <span className="asis-feed">
        <CameraFeed
          label={`사무실 ${String(i + 1).padStart(2, "0")}`}
          src={`${BASE}/cameras/${cam}.gif`}
          paused={mode === "single"}
        />
        <span className="asis-scrim" />
        <span className="asis-cam-label">
          사무실 {String(i + 1).padStart(2, "0")}
        </span>
        {mode === "single" && i === featured && (
          <span className="asis-tile-selected">
            <CheckIcon className="asis-check" />
          </span>
        )}
      </span>
    </div>
  );

  // 홈 화면은 시안과 동일 — 같은 홈 컴포넌트를 그대로 재사용한다.
  // (자체 상태바·하단탭·안드로이드 네비 포함. 중첩 .app-safe-frame 는 CSS 로 무력화)
  if (isHome) {
    return (
      <div className={frameClass} data-punch={punch} aria-hidden>
        <span className="asis-caption">As Is</span>
        <div className="asis-screen asis-home">
          <Suspense>
            <HomeScreen />
          </Suspense>
        </div>
      </div>
    );
  }

  // 큰 영상(단일채널) — 좁은 폭에선 고정 배치, 620+ 바텀시트 모드에선
  // .asis-single-wide 안에서 원래 16:9 크기 그대로 두고 그 위로 시트가 뜬다.
  const heroEl = (
    <div className="asis-hero" onDoubleClick={() => transitionTo("grid", null)}>
      <span className="asis-feed" key={featured}>
        <CameraFeed
          label={`사무실 ${String(featured + 1).padStart(2, "0")}`}
          src={`${BASE}/cameras/${CAMS[featured]}.gif`}
        />
      </span>
      <span className="asis-scrim" />
      <span className="asis-cam-label">
        사무실 {String(featured + 1).padStart(2, "0")}
      </span>
    </div>
  );

  return (
    <div className={frameClass} data-punch={punch} aria-hidden>
      <span className="asis-caption">As Is</span>
      <div className="asis-screen">
        {/* 상단 상태바 — 시안과 동일. */}
        {chromeVisible && (
          <>
            <span className="punch-hole" />
            <div
              className="asis-statusbar flex flex-none items-center justify-between bg-white px-5 text-[13px] font-semibold text-neutral-900"
              style={{ height: "27px" }}
            >
              <span>5:14</span>
              <div className="flex items-center gap-1.5 text-neutral-700">
                <MuteIcon className="h-3.5 w-3.5" />
                <WifiIcon className="h-3.5 w-3.5" />
                <DndIcon className="h-3.5 w-3.5" />
                <BatteryIcon className="h-3.5 w-5" level={80} />
              </div>
            </div>
          </>
        )}

        {/* 헤더 — 현장명·사업장·영상 종류 탭. 폭이 늘어도 크기 그대로. */}
        <header className="asis-header">
          <div className="asis-title">
            <span>8층 사무실</span>
            <ChevronDownIcon className="asis-chevron" />
          </div>
          <p className="asis-subtitle">에스원 본사 · N1234567</p>
          {/* 알약(실시간/녹화영상) 행에 날짜를 함께 둔다. 좁은 폭(<620)에선
              날짜가 알약 아래 줄로 내려가 왼쪽 정렬(flex-wrap), 620px 이상에선
              같은 줄 오른쪽 끝으로 붙는다(margin-left:auto). @container 로 판단. */}
          <div className="asis-pills">
            <span className="asis-pill asis-pill-on">실시간영상</span>
            <span className="asis-pill">녹화영상</span>
            <p className="asis-timestamp">
              {now ? formatAsIsClock(now) : " "}
            </p>
          </div>
        </header>

        {mode === "single" && wide ? (
          /* 620px 이상 단일채널 — 큰 영상은 원래 16:9 크기 그대로 두고, 그 위로
             카메라 목록 바텀시트가 '떠오른다'(오버레이 — 영상을 밀어내지 않는다).
             타이틀 행 오른쪽 끝 화살표로 펼침/접힘. */
          <div className="asis-single-wide">
            {heroEl}
            {/* 바텀시트 — 영역 하단에 절대배치로 떠서 영상 위에 겹친다. 패널(타이틀
                바 + 목록)이 통째로 슬라이드해 접히면 타이틀 바만 남는다. */}
            <div className="asis-sheet-region">
              <div className={`asis-sheet-panel ${sheetOpen ? "is-open" : "is-closed"}`}>
                <div className="asis-sheet-bar">
                  <span className="asis-section">카메라 목록</span>
                  <button
                    type="button"
                    className="asis-sheet-toggle"
                    onClick={() => setSheetOpen((o) => !o)}
                    aria-label={sheetOpen ? "카메라 목록 접기" : "카메라 목록 펼치기"}
                  >
                    <SheetArrow open={sheetOpen} />
                  </button>
                </div>
                <div className="asis-sheet-body">
                  <div className="asis-sheet-grid">
                    {CAMS.map((cam, i) => renderTile(cam, i))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 좁은 폭 단일채널: 큰 영상(고정) 아래 세로 2열 목록만 스크롤.
                다채널: 화면 전체가 목록(컨테이너 쿼리로 레터박스 판단). */}
            {mode === "single" && heroEl}
            {mode === "single" && <p className="asis-section">카메라 목록</p>}
            <div
              className={`asis-scroll${mode === "grid" ? " asis-scroll--grid" : ""}`}
            >
              <div className="asis-grid">
                {CAMS.map((cam, i) => renderTile(cam, i))}
              </div>
            </div>
          </>
        )}

        {/* 하단 탭바 — 시안과 동일한 마크업/아이콘(TabItem + nav/*.svg 마스크). */}
        <nav className="asis-tabbar mx-auto w-full border-t border-neutral-200 bg-white">
          <ul
            className="mx-auto grid w-full max-w-[480px] grid-cols-4 items-center"
            style={{ height: "60px" }}
          >
            <TabItem
              iconSrc={`${BASE}/nav/home.svg`}
              label="홈"
              onClick={() => router.push(`/home?${qs}&from=${from}`)}
            />
            <TabItem iconSrc={`${BASE}/nav/security.svg`} label="경비" />
            <TabItem iconSrc={`${BASE}/nav/video.svg`} label="영상" active />
            <TabItem iconSrc={`${BASE}/nav/menu.svg`} label="전체" />
          </ul>
        </nav>

        {/* 하단 안드로이드 네비 — 시안과 동일한 컴포넌트(폭은 기기 폭 따라감). */}
        {chromeVisible && (
          <div className="asis-nav">
            <AndroidNav platform="android" chromeVisible />
          </div>
        )}

        {/* 화면 전환 로딩 — 시안의 스켈레톤 UI 대신, As Is 는 로딩 GIF(loading_dots). */}
        {loading && (
          <div className="asis-loading">
            <img
              className="asis-loading-spinner"
              src={`${BASE}/loading_dots.gif`}
              alt=""
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
  );
}
