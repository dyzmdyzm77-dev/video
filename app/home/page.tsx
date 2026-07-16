"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BASE } from "../basePath";
import AndroidNav from "../components/AndroidNav";

// SSR 경고 없이 페인트 직전 실행되는 레이아웃 이펙트를 쓰기 위한 동형 훅.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// 전환 지속시간/이징 — 기기 프레임 리사이즈(globals.css 의 width 0.1s linear)와
// 동일한 값. 가감속 없이 일정한 속도(linear)로 움직여야 프레임·헤더·콘텐츠가
// 중간에 어긋나 보이지 않는다.
const MOVE_MS = 100;
const MOVE_EASE = "linear";
const WIDEN = `max-width ${MOVE_MS}ms ${MOVE_EASE}`;

// 홈 화면 — "내 경비 구역" 시안을 실제 코드로 구현한 화면.
// 하단탭의 홈 버튼으로 진입하며, 영상 탭·최근 본 영상 항목을 누르면 진입 전
// 화면안(?from=a|a1|b)으로 돌아간다. 경비 구역 카드는 펼침/접힘과
// 경비중 ↔ 해제중 상태 전환이 동작한다(시안 기준 인터랙션).
// 상단 정렬: "홍길동" 타이틀이 화면안의 "8층 사무실 A"와 같은 위치(상태바
// 아래 25dp, 좌 20dp)에 오도록 맞춘다.

/* ---------- 상태바(다른 화면과 동일) ---------- */

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

/* ---------- 하단탭(다른 화면과 동일한 마크업) ---------- */

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

/* ---------- 홈 화면 전용 아이콘 — 시안 SVG 에서 그대로 추출한 원본 에셋 ---------- */

function Icon({
  name,
  w,
  h,
  className,
}: {
  name: string;
  w: number;
  h: number;
  className?: string;
}) {
  return (
    <img
      src={`${BASE}/home/${name}.svg`}
      alt=""
      aria-hidden
      width={w}
      height={h}
      className={className}
    />
  );
}

/* ---------- 경비 구역 카드 ---------- */

type ZoneStatus = "armed" | "disarmed" | "inspection";
type Zone = {
  id: number;
  name: string;
  status: ZoneStatus;
  expanded: boolean;
};

function ZoneCard({
  zone,
  onToggle,
  onSetStatus,
}: {
  zone: Zone;
  onToggle: () => void;
  onSetStatus: (s: ZoneStatus) => void;
}) {
  const { status, expanded } = zone;
  const palette =
    status === "armed"
      ? { bg: "#1D6CEB", panel: "#1A61D3", text: "white", sub: "rgba(255,255,255,0.7)" }
      : status === "disarmed"
        ? { bg: "#20BE85", panel: "#1BA372", text: "white", sub: "rgba(255,255,255,0.7)" }
        : { bg: "#FFE4E8", panel: "#FFD4DA", text: "#FF4555", sub: "rgba(255,69,85,0.7)" };

  // 카드 상단(요약) — 제목/기기번호/상태/액션 버튼.
  return (
    <div className="overflow-hidden rounded-[10px]">
      <div style={{ backgroundColor: palette.bg, padding: "16px 20px 20px" }}>
        {/* 제목 줄 — 누르면 펼침/접힘(점검중 카드는 고정). */}
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={status === "inspection" ? undefined : onToggle}
          style={{
            cursor: status === "inspection" ? "default" : "pointer",
            color: palette.text,
          }}
        >
          <span className="text-[16px] font-semibold leading-none" style={{ color: palette.text }}>
            {zone.name}
          </span>
          {status !== "inspection" && (
            <Icon name={expanded ? "icon-chevron-up-white" : "icon-chevron-down-white"} w={12} h={8} />
          )}
        </button>
        <p className="mt-[6px] text-[12px] leading-none" style={{ color: palette.sub }}>
          에스원 본사 · N1234567
        </p>

        {/* 상태 + 액션 버튼 줄 — 버튼 유무와 무관하게 높이 40px 고정, 세로 중앙
            정렬로 세 카드의 상태 아이콘·텍스트 위치를 동일하게 맞춘다(시안 기준
            아이콘 중심 = 카드 상단에서 86dp). */}
        <div
          className="mt-4 flex items-center justify-between"
          style={{ height: "40px" }}
        >
          <span className="flex items-center gap-2">
            {status === "armed" && <Icon name="icon-shield" w={20} h={26} />}
            {status === "disarmed" && <Icon name="icon-door" w={20} h={29} />}
            {status === "inspection" && <Icon name="icon-tools" w={20} h={27} />}
            <span className="flex items-center gap-1.5 text-[22px] font-bold leading-none" style={{ color: palette.text }}>
              {status === "armed" ? "경비중" : status === "disarmed" ? "해제중" : "점검중"}
              {status === "inspection" && <Icon name="icon-warn" w={16} h={16} />}
            </span>
          </span>
          {status === "armed" && (
            <button
              type="button"
              onClick={() => onSetStatus("disarmed")}
              className="flex items-center justify-center rounded-[4px] text-[14px] font-semibold"
              style={{ width: "60px", height: "40px", backgroundColor: "#BBD3F9", color: "#1D6CEB" }}
            >
              해제
            </button>
          )}
          {status === "disarmed" && (
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => onSetStatus("armed")}
                className="flex items-center justify-center rounded-[4px] text-[14px] font-semibold"
                style={{ width: "60px", height: "40px", backgroundColor: "#BCEBDA", color: "#0F8A5F" }}
              >
                재택
              </button>
              <button
                type="button"
                onClick={() => onSetStatus("armed")}
                className="flex items-center justify-center rounded-[4px] text-[14px] font-semibold"
                style={{ width: "60px", height: "40px", backgroundColor: "#BCEBDA", color: "#0F8A5F" }}
              >
                경비
              </button>
            </span>
          )}
        </div>
      </div>

      {/* 펼침 패널 — 출입문/열쇠 지원. */}
      {expanded && status !== "inspection" && (
        <div style={{ backgroundColor: palette.panel, padding: "8px 20px 12px" }}>
          {[
            { label: "출입문 01", action: "열기", disabled: false },
            { label: "출입문 02", action: "열기", disabled: true },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between"
              style={{ height: "52px", opacity: row.disabled ? 0.4 : 1 }}
            >
              <span className="text-[15px] font-semibold text-white">{row.label}</span>
              <span className="flex items-center gap-1 text-[14px] font-medium text-white">
                {row.action}
                <Icon name="icon-chevron-right-white" w={9} h={12} />
              </span>
            </div>
          ))}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.25)" }} />
          <div className="flex items-center justify-between" style={{ height: "52px" }}>
            <span className="text-[15px] font-semibold text-white">열쇠 지원</span>
            <span className="flex items-center gap-1 text-[14px] font-medium text-white">
              요청
              <Icon name="icon-chevron-right-white" w={9} h={12} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 페이지 ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
const formatStamp = (d: Date) =>
  `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const RECENT_VIDEOS = [
  { thumb: "cam-thumb-1.svg", name: "카메라 03", sub: "3층 사무실 · 방금 전" },
  { thumb: "cam-thumb-2.svg", name: "카메라 01", sub: "OO 공장 1구역 · 2시간 전" },
  { thumb: "cam-thumb-3.svg", name: "카메라 02", sub: "1층 사무실 · 3시간 전" },
];

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const platform = params.get("platform") === "ios" ? "ios" : "android";
  const initialChrome = params.get("chrome") === "1";
  // 진입 전 화면안. 영상 탭/최근 본 영상으로 돌아갈 때 사용한다.
  const from = ["a", "a1", "b"].includes(params.get("from") ?? "")
    ? (params.get("from") as string)
    : "a";
  const [chromeVisible, setChromeVisible] = useState(initialChrome);
  const [stamp, setStamp] = useState<string>("");
  const [zones, setZones] = useState<Zone[]>([
    { id: 1, name: "1층 회의실", status: "armed", expanded: true },
    { id: 2, name: "2층 회의실", status: "disarmed", expanded: false },
    { id: 3, name: "3층 회의실", status: "inspection", expanded: false },
  ]);

  // 마지막 갱신 시각 — 진입 시 1회, 새로고침 아이콘 누르면 갱신.
  useEffect(() => {
    setStamp(formatStamp(new Date()));
  }, []);

  // 폭이 620 경계를 넘으면 1↔2단 전환. 스크롤 영역(=프레임) 폭을 ResizeObserver 로
  // 감시한다(배율 transform 영향 없는 레이아웃 폭). 컬럼 폭 자체는 grid 트랙(minmax
  // 280~320)이 해상도에 맞게 잡고(리플로우/2단계 없음), 전환 시 위치만 아래 FLIP 이
  // translate 로 헤더와 함께 미끄러지게 한다.
  const [twoCol, setTwoCol] = useState(false);
  const twoColRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  // 전환 직전 두 컬럼의 위치(뷰포트 좌표). setTwoCol 직전 캡처해 FLIP First 로 쓴다.
  const flipFromRef = useRef<{ left?: DOMRect; right?: DOMRect } | null>(null);
  // 전환 세대 — 끊긴 전환의 인라인 스타일이 남지 않도록 타임아웃 정리에 쓴다.
  const flipGenRef = useRef(0);

  useEffect(() => {
    const BP = 620;
    const el = contentRef.current;
    const target = el?.parentElement; // 스크롤 영역 — 폭 = 기기 프레임 폭
    if (!el || !target) return;
    let armed = false; // 초기 settle 전(첫 판정)에는 애니메이션 없이 상태만 반영
    const evaluate = (observed?: number) => {
      // 목표 폭(--device-w) 기준으로 판정 — 프리셋 클릭/드래그 순간 즉시 바뀌는 값이라
      // 프레임이 0.1s 동안 자라는 것과 같은 시점에 전환을 시작할 수 있다.
      // 변수 없는 실기기에선 관측 폭(observed)으로 폴백.
      const varW = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--device-w"),
      );
      const w =
        Number.isFinite(varW) && varW > 0
          ? varW
          : (observed ?? target.getBoundingClientRect().width);
      const want = w >= BP;
      if (want !== twoColRef.current) {
        twoColRef.current = want;
        if (armed) {
          flipFromRef.current = {
            left: leftColRef.current?.getBoundingClientRect(),
            right: rightColRef.current?.getBoundingClientRect(),
          };
        }
        setTwoCol(want);
      }
      armed = true;
    };
    // 프리셋 클릭(devicechange)·드래그(deviceresize)가 --device-w 갱신 직후 동기로
    // 쏘는 이벤트를 직접 듣는다 → 프레임 CSS 전환과 '같은 프레임'에 전환 시작.
    // (RO 는 폭이 실제로 변한 다음 프레임에야 발화해 100ms 중 16~33ms 늦는다.)
    const onDevice = () => evaluate();
    window.addEventListener("devicechange", onDevice);
    window.addEventListener("deviceresize", onDevice);
    // ResizeObserver 는 초기 settle + 이벤트 없는 환경(실기기 회전 등) 폴백.
    const ro = new ResizeObserver((entries) => {
      evaluate(entries[entries.length - 1].contentRect.width);
    });
    ro.observe(target);
    return () => {
      window.removeEventListener("devicechange", onDevice);
      window.removeEventListener("deviceresize", onDevice);
      ro.disconnect();
    };
  }, []);

  // 전환 연출 — 원칙:
  // · 모든 위치 보정은 margin(레이아웃 속성) — 프레임 폭(width)과 같은 레이아웃
  //   패스에서 계산돼 매 프레임 정확히 상쇄된다(transform 은 컴포지터 스레드라 떨림).
  // · '최종 폭'은 커밋 시점 측정값이 아니라 목표 해상도(--device-w)에서 계산 —
  //   측정값은 프레임이 아직 옛 폭이라 스테일해서, 620→360 에서 440 으로 커졌다가
  //   320 으로 스냅되는(호들갑) 원인이었다.
  // · 오른쪽 컬럼은 슬라이드 동안 폭을 인라인으로 '고정' — margin 이 grid/block 의
  //   자동 폭을 왜곡해(마진만큼 늘어남) 커졌다 줄어드는 걸 막는다. 순수 이동만.
  useIsoLayoutEffect(() => {
    const from = flipFromRef.current;
    flipFromRef.current = null;
    if (!from) return;
    const rootCS = getComputedStyle(document.documentElement);
    const ds = parseFloat(rootCS.getPropertyValue("--device-scale")) || 1;
    const wrap = contentRef.current;
    const left = leftColRef.current;
    const right = rightColRef.current;
    if (!wrap) return;
    // 목표 프레임 폭 — 프리셋/드래그가 --device-w 를 즉시 갱신하므로 이것이 진짜
    // 최종값이다. 없으면(실기기) 스크롤 영역 관측 폭으로 폴백.
    const varW = parseFloat(rootCS.getPropertyValue("--device-w"));
    const targetW =
      Number.isFinite(varW) && varW > 0
        ? varW
        : (wrap.parentElement?.getBoundingClientRect().width ?? 360) / ds;
    // 목표 해상도에서의 진짜 최종 컬럼 폭.
    const finalColW = twoCol
      ? Math.min(320, Math.max(280, (Math.min(targetW, 700) - 60) / 2))
      : Math.min(targetW, 480) - 40;
    // 래퍼 폭도 시작→최종을 명시적으로 애니메이션한다. max-width 클램프가 전환
    // 중간에 걸렸다 풀리면(예: 620→360 에서 480 캡) 컬럼 기준 위치가 꺾여(비선형)
    // 선형 margin 보정과 어긋나 좌우가 새는데, 명시 폭은 처음부터 끝까지 선형이라
    // 중심(mx-auto) 위치도 선형 → 보정이 정확히 상쇄된다.
    // 정리(cleanup) — 인라인 스타일을 모두 걷어 자연 레이아웃(프레임 폭을 따라감)으로
    // 되돌린다. transitionend 에 의존하면 전환이 끊길 때(빠른 프리셋 연타) 안 불려
    // 폭이 인라인에 박히고, 그 뒤 단일→단일(480→360)에선 이 이펙트가 안 돌아 못 치운다.
    // → 아래에서 '세대(gen) 가드 + 타임아웃'으로 항상 지운다.
    const gen = ++flipGenRef.current;
    const clearAll = () => {
      for (const el of [wrap, left, right]) {
        if (!el) continue;
        el.style.transition = "";
        el.style.marginLeft = "";
        el.style.marginTop = "";
        el.style.width = "";
        el.style.maxWidth = "";
      }
    };
    // 직전 전환이 끊겨 남은 인라인 스타일부터 청소(정확한 측정 + 잔재 방지).
    clearAll();
    void wrap.offsetWidth;

    const wrapFrom = wrap.getBoundingClientRect().width / ds;
    const wrapTo = twoCol ? Math.min(targetW, 700) : Math.min(targetW, 480);
    const plays: (() => void)[] = [];

    // 래퍼 폭: 시작→최종 명시(선형 → mx-auto 중심도 선형이라 margin 보정과 정확히 상쇄).
    wrap.style.transition = "none";
    wrap.style.width = `${wrapFrom}px`;
    wrap.style.maxWidth = "none";
    plays.push(() => {
      wrap.style.transition = `width ${MOVE_MS}ms ${MOVE_EASE}`;
      wrap.style.width = `${wrapTo}px`;
    });

    // 왼쪽 컬럼(내 경비 구역): 위치(margin) + 폭을 시작→진짜 최종으로.
    if (left && from.left && from.left.width > 0) {
      const last = left.getBoundingClientRect();
      if (last.width > 0) {
        const dx = (from.left.left - last.left) / ds;
        const fromW = from.left.width / ds;
        left.style.transition = "none";
        left.style.marginLeft = `${dx}px`;
        left.style.width = `${fromW}px`;
        plays.push(() => {
          left.style.transition = `margin-left ${MOVE_MS}ms ${MOVE_EASE}, width ${MOVE_MS}ms ${MOVE_EASE}`;
          left.style.marginLeft = "0px";
          left.style.width = `${finalColW}px`;
        });
      }
    }

    // 오른쪽 컬럼: 폭 고정(인라인) + 가로 margin 이동만. 디바이스 '오른쪽 바깥'에서
    // 왼쪽으로 슥 들어오고(진입), 반대로 오른쪽 바깥으로 슥 나간다(해제). 오른쪽으로
    // 넘친 부분은 스크롤 영역의 overflow-x:hidden 이 잘라 가려준다.
    if (right && from.right && from.right.width > 0 && from.left) {
      const last = right.getBoundingClientRect();
      if (last.width > 0) {
        if (twoCol) {
          // 2단 진입: 오른쪽 밖에서 시작 → 최종 자리로 왼쪽으로 슥. 폭은 최종 트랙 폭.
          right.style.transition = "none";
          right.style.marginLeft = `${finalColW + 60}px`;
          right.style.width = `${finalColW}px`;
          plays.push(() => {
            right.style.transition = `margin-left ${MOVE_MS}ms ${MOVE_EASE}`;
            right.style.marginLeft = "0px";
          });
        } else {
          // 2단 해제: 옆자리(2단 위치)에서 오른쪽 밖으로 슥. 다 나간 뒤 정리에서 원래
          // 아래(단일) 자리로 복귀 — 화면 밖이라 스냅이 안 보인다.
          const dx = (from.right.left - last.left) / ds;
          const dy = (from.right.top - last.top) / ds;
          const colW = from.right.width / ds;
          right.style.transition = "none";
          right.style.marginLeft = `${dx}px`;
          right.style.marginTop = `${dy}px`;
          right.style.width = `${colW}px`;
          plays.push(() => {
            right.style.transition = `margin-left ${MOVE_MS}ms ${MOVE_EASE}`;
            right.style.marginLeft = `${dx + colW + 60}px`; // 오른쪽 밖으로
          });
        }
      }
    }

    // rAF 대신 강제 리플로우로 시작 상태를 커밋 → 같은 페인트에서 전환 시작(프레임과
    // 동시 출발). 그 뒤 gen 가드 타임아웃으로 정리(끊겨도 항상 지워짐).
    void document.body.offsetWidth;
    plays.forEach((run) => run());
    window.setTimeout(() => {
      if (flipGenRef.current === gen) clearAll();
    }, MOVE_MS + 80);
  }, [twoCol]);

  const goVideo = () => {
    router.push(
      `/${from}?platform=${platform}${chromeVisible ? "&chrome=1" : ""}`,
    );
  };

  const toggleZone = (id: number) =>
    setZones((zs) =>
      zs.map((z) => (z.id === id ? { ...z, expanded: !z.expanded } : z)),
    );
  const setZoneStatus = (id: number, status: ZoneStatus) =>
    setZones((zs) => zs.map((z) => (z.id === id ? { ...z, status } : z)));

  return (
    <div className="app-safe-frame h-full w-full flex flex-col items-center bg-white">
      <div
        className="relative flex min-h-0 flex-1 w-full flex-col overflow-hidden"
        style={{ backgroundColor: "#EDF0F5" }}
      >
        {/* 펀치홀 카메라 점 — Android 환경에서 시스템 바가 보일 때만. 누르면 토글. */}
        {platform === "android" && chromeVisible && (
          <button
            type="button"
            aria-label="시스템 바 토글"
            onClick={() => setChromeVisible((v) => !v)}
            className="punch-hole"
          />
        )}
        {/* 안드로이드 상태바 — Android 환경에서만. 배경은 홈 화면과 동일 톤. */}
        {platform === "android" && chromeVisible && (
          <div
            className="relative flex items-center justify-between px-5 text-[13px] font-semibold text-neutral-900"
            style={{ height: "27px", backgroundColor: "#EDF0F5" }}
          >
            <span>5:14</span>
            <div className="flex items-center gap-1.5 text-neutral-700">
              <MuteIcon className="h-3.5 w-3.5" />
              <WifiIcon className="h-3.5 w-3.5" />
              <DndIcon className="h-3.5 w-3.5" />
              <BatteryIcon className="h-3.5 w-5" level={80} />
            </div>
          </div>
        )}

        {/* 고정 헤더 — "홍길동"은 화면안 타이틀과 같은 위치(상태바 아래 25dp).
            스크롤 영역 밖이라 콘텐츠가 스크롤돼도 항상 상단에 남는다.
            시안처럼 텍스트 아래에도 여백을 둔 띠 영역(하단 12dp).
            단일(480)/2단(700) 상한을 아래 콘텐츠와 맞춰 홍길동·종 아이콘이 항상
            콘텐츠 좌우 끝과 정렬된다. 전환 시 view-transition 으로 함께 모핑. */}
        <div
          className={`mx-auto w-full flex-none px-5 ${twoCol ? "max-w-[700px]" : "max-w-[480px]"}`}
          style={{ transition: WIDEN }}
        >
          <div
            className="flex items-center justify-between"
            style={{ paddingTop: "17.7px", paddingBottom: "12px" }}
          >
            <button type="button" className="flex items-center gap-1">
              <span className="text-[16px] font-bold leading-none text-[#111111]">홍길동</span>
              <Icon name="icon-chevron-right-dark" w={9} h={12} />
            </button>
            <button type="button" aria-label="알림">
              <Icon name="icon-bell" w={26} h={26} />
            </button>
          </div>
        </div>

        {/* 스크롤 콘텐츠 — 좁은 프리셋(~480px)은 480px 단일 컬럼으로 가운데 정렬,
            620px 이상에선 2단(왼쪽=내 경비 구역, 오른쪽=나머지) 구성. 스크롤 영역
            폭 = 프레임 폭(--device-w)이라 컨테이너 쿼리(@container)로 프레임 폭 기준
            분기한다(데스크톱 미리보기는 뷰포트≠프레임이라 미디어쿼리로는 못 잡음). */}
        <div className="@container min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* 480~619(단일)에선 콘텐츠 폭 480 고정 — 폭이 넓어져도 콘텐츠는 그대로,
              양옆 여백만 늘어난다. 620px 이상에서 2단(각 280~320, 간격 20, 가운데 정렬).
              전환은 위 useEffect 의 View Transition 으로 각 컬럼이 부드럽게 모핑된다. */}
          <div
            ref={contentRef}
            className={`mx-auto w-full px-5 pb-10 ${twoCol ? "max-w-[700px] grid grid-cols-[minmax(280px,320px)_minmax(280px,320px)] items-start justify-center gap-x-5" : "max-w-[480px]"}`}
          >
            {/* ── 왼쪽 단(620px+): 내 경비 구역 — 전환 중 오른쪽 콘텐츠가 슬라이드로
                겹칠 때 그 아래 레이어로 지나가도록 왼쪽을 위 레이어에 둔다. 배경은
                페이지와 같은 색으로 채워 카드 사이 틈으로 밑이 비치지 않게 한다. */}
            <div ref={leftColRef} className="relative z-[1] bg-[#EDF0F5]">
            {/* 내 경비 구역 — 헤더 하단 여백(12dp)과 합쳐 시안 간격(32dp) 유지. */}
            <div className="mt-5 flex items-center justify-between">
              <h2 className="text-[18px] font-bold leading-none text-[#111111]">내 경비 구역</h2>
              <span className="flex items-center gap-1.5">
                <span suppressHydrationWarning className="text-[12px] leading-none" style={{ color: "#B0B5BC" }}>
                  {stamp}
                </span>
                <button type="button" aria-label="새로고침" onClick={() => setStamp(formatStamp(new Date()))}>
                  <Icon name="icon-refresh" w={17} h={18} />
                </button>
              </span>
            </div>

            <div className="mt-[18px] flex flex-col gap-2">
              {zones.map((z) => (
                <ZoneCard
                  key={z.id}
                  zone={z}
                  onToggle={() => toggleZone(z.id)}
                  onSetStatus={(s) => setZoneStatus(z.id, s)}
                />
              ))}
            </div>

            {/* 내 경비 구역 편집 */}
            <button type="button" className="mx-auto mt-4 flex items-center gap-1.5 py-2" style={{ color: "#767678" }}>
              <Icon name="icon-gear" w={19} h={18} />
              <span className="text-[14px] font-medium leading-none">내 경비 구역 편집</span>
            </button>
            </div>

            {/* ── 오른쪽 단(620px+): 최근 본 영상 · 권한 신청 현황 · 추천·혜택 ── */}
            <div ref={rightColRef}>
            {/* 최근 본 영상 — 2단일 땐 왼쪽 헤더(mt-5)와 상단을 맞춘다. */}
            <h2 className="mt-9 text-[18px] font-bold leading-none text-[#111111] @[620px]:mt-5">최근 본 영상</h2>
            <div className="mt-[18px] overflow-hidden rounded-[10px] bg-white">
              {RECENT_VIDEOS.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={goVideo}
                  className="flex w-full items-center gap-4 px-4 text-left"
                  style={{ height: "72px" }}
                >
                  <img src={`${BASE}/home/${v.thumb}`} alt="" aria-hidden className="h-10 w-10" />
                  <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
                    <span className="text-[15px] font-semibold leading-none text-[#111111]">{v.name}</span>
                    <span className="text-[13px] leading-none" style={{ color: "#A8ADB4" }}>
                      {v.sub}
                    </span>
                  </span>
                  <Icon name="icon-chevron-right-dark" w={9} h={12} />
                </button>
              ))}
            </div>

            {/* 권한 신청 현황 */}
            <h2 className="mt-9 text-[18px] font-bold leading-none text-[#111111]">권한 신청 현황</h2>
            <div className="mt-[18px] overflow-hidden rounded-[10px] bg-white">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex w-full items-center gap-3 px-4" style={{ height: "72px" }}>
                  <span className="flex min-w-0 flex-1 flex-col gap-[6px]">
                    <span className="text-[16px] font-semibold leading-none text-[#111111]">강*호</span>
                    <span className="text-[13px] leading-none" style={{ color: "#A8ADB4" }}>
                      에스원 본사 · N1234567
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-[14px] font-medium leading-none" style={{ color: "#FF4555" }}>
                    승인대기
                    <Icon name="icon-chevron-right-dark" w={9} h={12} />
                  </span>
                </div>
              ))}
            </div>

            {/* 추천 · 혜택 — 다른 컴포넌트와 달리 폭이 넓어져도 여백이 늘어나지
                않고, 320×108 기준 디자인이 통째로 비율 고정 확대된다.
                (컨테이너 쿼리 단위 cqw: 1cqw = 배너 폭의 1%, 320px 기준 3.2px) */}
            <h2 className="mt-9 text-[18px] font-bold leading-none text-[#111111]">추천 · 혜택</h2>
            <div
              className="mt-[18px] flex flex-col gap-2"
              style={{ containerType: "inline-size" }}
            >
              <div
                className="relative flex items-center overflow-hidden"
                style={{
                  backgroundColor: "#F0E3FF",
                  aspectRatio: "320 / 108",
                  borderRadius: "3.125cqw",
                  paddingLeft: "8.125cqw",
                }}
              >
                <div className="flex flex-col" style={{ gap: "2.1875cqw" }}>
                  <span className="leading-none" style={{ color: "#767678", fontSize: "3.4375cqw" }}>
                    지인을 소개하고 안심을 나누세요
                  </span>
                  <span className="font-bold leading-[1.25] text-[#262626]" style={{ fontSize: "5cqw" }}>
                    에스원 서비스 소개하고
                    <br />
                    <span style={{ color: "#7C3AED" }}>상품권 받아가세요!</span>
                  </span>
                </div>
                <img
                  src={`${BASE}/home/banner-illust-1.png`}
                  alt=""
                  aria-hidden
                  className="absolute"
                  style={{ right: "-1.5625cqw", top: "0.9375cqw", width: "33.75cqw", height: "31.875cqw", objectFit: "contain" }}
                />
              </div>
              <div
                className="relative flex items-center overflow-hidden"
                style={{
                  backgroundColor: "#E2EDFE",
                  aspectRatio: "320 / 108",
                  borderRadius: "3.125cqw",
                  paddingLeft: "8.125cqw",
                }}
              >
                <div className="flex flex-col" style={{ gap: "2.1875cqw" }}>
                  <span className="leading-none" style={{ color: "#565E6B", fontSize: "3.4375cqw" }}>
                    기업용 보안 클라우드 출시 기념 혜택
                  </span>
                  <span className="font-bold leading-[1.25]" style={{ color: "#2F2170", fontSize: "5cqw" }}>
                    클라우드로 더 안전하게!
                    <br />
                    <span style={{ color: "#3BB94F" }}>용량 20% UP!</span>
                  </span>
                </div>
                <img
                  src={`${BASE}/home/banner-illust-2.png`}
                  alt=""
                  aria-hidden
                  className="absolute"
                  style={{ right: "3.125cqw", top: "3.125cqw", width: "29.0625cqw", height: "29.0625cqw", objectFit: "contain" }}
                />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* 채팅 플로팅 버튼(56×56) — 스크롤과 무관하게 하단탭 위 20dp·우측 20dp 고정.
            fab-chat.svg 는 그림자 여유 포함 90×90(원 좌우 17·상 13·하 21 여백)이라
            원 기준 20dp 가 되도록 오프셋을 보정한다.
            단일(480)/2단(700) 상한을 헤더·콘텐츠와 맞춰 콘텐츠 오른쪽 끝(종 아이콘
            라인)을 따라간다. */}
        <div
          className={`pointer-events-none absolute inset-x-0 z-10 mx-auto w-full ${twoCol ? "max-w-[700px]" : "max-w-[480px]"}`}
          style={{ bottom: "60px", height: 0, transition: WIDEN }}
        >
          <img
            src={`${BASE}/home/fab-chat.svg`}
            alt=""
            aria-hidden
            className="absolute"
            style={{ right: "3px", bottom: "-1px", width: "90px", height: "90px" }}
          />
        </div>

        {/* 하단 탭바 — 화면안과 동일한 컴포넌트·위치. */}
        <nav className="mx-auto mt-auto w-full border-t border-neutral-200 bg-white">
          <ul
            className="mx-auto grid w-full max-w-[480px] grid-cols-4 items-center"
            style={{ height: "60px" }}
          >
            <TabItem iconSrc={`${BASE}/nav/home.svg`} label="홈" active />
            <TabItem iconSrc={`${BASE}/nav/security.svg`} label="경비" />
            <TabItem
              iconSrc={`${BASE}/nav/video.svg`}
              label="영상"
              onClick={goVideo}
            />
            <TabItem iconSrc={`${BASE}/nav/menu.svg`} label="전체" />
          </ul>
        </nav>
      </div>

      {/* 하단 안드로이드 네비 — 다른 화면과 동일하게 실제 컴포넌트 사용. */}
      <AndroidNav platform={platform} chromeVisible={chromeVisible} />
    </div>
  );
}

export default function PageHome() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
