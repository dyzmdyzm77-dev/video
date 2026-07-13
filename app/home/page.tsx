"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BASE } from "../basePath";
import AndroidNav from "../components/AndroidNav";

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

        {/* 상태 + 액션 버튼 줄 */}
        <div className="mt-4 flex items-end justify-between">
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
            className="absolute z-50 -translate-x-1/2 rounded-full bg-black"
            style={{ left: "50%", top: "5.5px", width: "16px", height: "16px" }}
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

        {/* 스크롤 콘텐츠 — 넓은 프리셋에선 480px 컬럼으로 가운데 정렬. */}
        <div className="min-h-0 w-full flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto w-full max-w-[480px] px-5 pb-10">
            {/* 헤더 — "홍길동"은 화면안 타이틀과 같은 위치(상태바 아래 25dp). */}
            <div className="flex items-center justify-between" style={{ paddingTop: "17.7px" }}>
              <button type="button" className="flex items-center gap-1">
                <span className="text-[16px] font-bold leading-none text-[#111111]">홍길동</span>
                <Icon name="icon-chevron-right-dark" w={9} h={12} />
              </button>
              <button type="button" aria-label="알림">
                <Icon name="icon-bell" w={26} h={26} />
              </button>
            </div>

            {/* 내 경비 구역 */}
            <div className="mt-8 flex items-center justify-between">
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

            {/* 최근 본 영상 */}
            <h2 className="mt-9 text-[18px] font-bold leading-none text-[#111111]">최근 본 영상</h2>
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

            {/* 추천 · 혜택 */}
            <h2 className="mt-9 text-[18px] font-bold leading-none text-[#111111]">추천 · 혜택</h2>
            <div className="mt-[18px] flex flex-col gap-2">
              <div
                className="relative flex items-center overflow-hidden rounded-[10px] px-[26px]"
                style={{ backgroundColor: "#F0E3FF", height: "108px" }}
              >
                <div className="flex flex-col gap-[7px]">
                  <span className="text-[11px] leading-none" style={{ color: "#767678" }}>
                    지인을 소개하고 안심을 나누세요
                  </span>
                  <span className="text-[16px] font-bold leading-[1.25] text-[#262626]">
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
                  style={{ right: "-5px", top: "3px", width: "108px", height: "102px", objectFit: "contain" }}
                />
              </div>
              <div
                className="relative flex items-center overflow-hidden rounded-[10px] px-[26px]"
                style={{ backgroundColor: "#E2EDFE", height: "108px" }}
              >
                <div className="flex flex-col gap-[7px]">
                  <span className="text-[11px] leading-none" style={{ color: "#565E6B" }}>
                    기업용 보안 클라우드 출시 기념 혜택
                  </span>
                  <span className="text-[16px] font-bold leading-[1.25]" style={{ color: "#2F2170" }}>
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
                  style={{ right: "10px", top: "10px", width: "93px", height: "93px", objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 채팅 플로팅 버튼(56×56) — 스크롤과 무관하게 하단탭 위 20dp·우측 20dp 고정.
            fab-chat.svg 는 그림자 여유 포함 90×90(원 좌우 17·상 13·하 21 여백)이라
            원 기준 20dp 가 되도록 오프셋을 보정한다. */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 mx-auto w-full max-w-[480px]"
          style={{ bottom: "60px", height: 0 }}
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
