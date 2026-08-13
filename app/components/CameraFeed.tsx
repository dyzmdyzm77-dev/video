import { BASE } from "../basePath";
import { nextVideoFit, videoFitIcon, type VideoFit } from "./videoFit";
import { requestDeviceRotate, useDeviceLandscape } from "./deviceRotate";
import { toggleImmersive, useImmersive } from "./immersive";
import { memo, useEffect, useRef, useState } from "react";

type CameraFeedProps = {
  label: string;
  src: string;
  paused?: boolean;
  // 녹화 모드: 타임라인 시각(playbackMs)에 해당하는 프레임을 직접 그려
  // 배속/되감기/탐색이 영상에도 반영되게 한다.
  playbackMs?: number | null;
  driveByPlayback?: boolean;
  // 애니메이션 GIF 를 실제로 돌릴지. 다채널은 스와이프를 위해 모든 페이지를 동시에
  // 렌더하므로(2×4 면 16장 중 보이는 건 8장) 안 보이는 페이지까지 GIF 가 계속
  // 디코딩된다. paused 로는 안 멈춘다 — opacity 0 은 '가리기'일 뿐 <img> 의 GIF
  // 애니메이션은 계속 돈다. 그래서 비활성일 땐 <img> 를 아예 렌더하지 않고
  // 캔버스(첫 프레임) 정지 화면만 남긴다.
  animate?: boolean;
  // 타일 안에서 원본을 어떻게 맞출지. 딤 상태의 '화면 맞춤' 버튼이 고른다.
  //   fill    = 타일을 가득 채운다(원본 비율 무시)
  //   contain = 원본 비율 유지, 남는 자리는 검정
  //   cover   = 원본 비율 유지한 채 넘치는 쪽을 자른다(크롭)
  // 원본이 320×214(≈3:2)라 16:9 타일에서는 셋이 눈에 띄게 다르다.
  fit?: VideoFit;
};

// ---- GIF 프레임 디코딩 ----
// 배속/되감기/탐색 시 영상이 타임라인(playbackMs)을 따라가도록, GIF를 <img>로
// 자체 재생시키는 대신 프레임을 직접 디코딩해 캔버스에 그린다. 디코더와 프레임
// 비트맵은 src 단위로 모듈 레벨에서 캐시해 그리드의 동일 src 타일들이 공유한다.
type GifInfo = { decoder: ImageDecoder; frameCount: number; frameDurationMs: number };
const decoderCache = new Map<string, Promise<GifInfo>>();

// WebCodecs(ImageDecoder) 미지원/실패 감지용 전역 플래그.
// iOS Safari 등에서 ImageDecoder/createImageBitmap(VideoFrame)이 다중·재진입 시
// 실패하면 캔버스가 검게 남으므로, 한 번이라도 실패하면 애니메이션 GIF(<img>)로 폴백한다.
let webcodecsBroken =
  typeof window !== "undefined" && typeof window.ImageDecoder === "undefined";
function markWebcodecsBroken() {
  webcodecsBroken = true;
}

function getGifInfo(src: string): Promise<GifInfo> {
  let p = decoderCache.get(src);
  if (!p) {
    p = (async () => {
      const res = await fetch(src);
      const data = await res.arrayBuffer();
      const decoder = new ImageDecoder({ data, type: "image/gif" });
      await decoder.tracks.ready;
      const track = decoder.tracks.selectedTrack!;
      const frameCount = track.frameCount;
      const r0 = await decoder.decode({ frameIndex: 0 });
      const frameDurationMs = (r0.image.duration ?? 30000) / 1000;
      r0.image.close();
      return { decoder, frameCount, frameDurationMs };
    })();
    // 실패 시 캐시를 비워 재시도 가능하게 하고, 폴백 플래그를 세운다.
    p.catch(() => {
      decoderCache.delete(src);
      markWebcodecsBroken();
    });
    decoderCache.set(src, p);
  }
  return p;
}

const FRAME_CACHE_CAP = 120;
const frameCache = new Map<string, ImageBitmap>();
const frameInFlight = new Map<string, Promise<ImageBitmap>>();
async function getFrameBitmap(src: string, idx: number): Promise<ImageBitmap> {
  const key = `${src}#${idx}`;
  const cached = frameCache.get(key);
  if (cached) {
    frameCache.delete(key);
    frameCache.set(key, cached); // LRU 갱신
    return cached;
  }
  const inflight = frameInFlight.get(key);
  if (inflight) return inflight;
  const p = (async () => {
    const { decoder } = await getGifInfo(src);
    const r = await decoder.decode({ frameIndex: idx });
    const bmp = await createImageBitmap(r.image);
    r.image.close();
    frameCache.set(key, bmp);
    while (frameCache.size > FRAME_CACHE_CAP) {
      const oldestKey = frameCache.keys().next().value as string;
      frameCache.get(oldestKey)?.close();
      frameCache.delete(oldestKey);
    }
    frameInFlight.delete(key);
    return bmp;
  })();
  frameInFlight.set(key, p);
  return p;
}

// 디코딩 성공 여부(ok)를 반환한다. iOS Safari 등에서 ImageDecoder가 실패하면
// ok=false가 되어 호출부가 애니메이션 GIF(<img>)로 폴백한다.
export function useGifFrameCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  src: string,
  playbackMs: number | null,
): boolean {
  const reqRef = useRef(-1);
  // 마지막으로 캔버스에 그린 프레임 키(src#idx). 틱마다 playbackMs 는 바뀌지만
  // 프레임 인덱스가 같으면 비트맵 조회·drawImage 를 통째로 건너뛴다.
  const drawnRef = useRef("");
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (playbackMs == null) return;
    // WebCodecs 미지원/이전 실패가 감지되면 캔버스 경로를 포기하고 폴백한다.
    if (webcodecsBroken || typeof window.ImageDecoder === "undefined") {
      setOk(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const info = await getGifInfo(src);
        if (cancelled) return;
        const totalMs = info.frameCount * info.frameDurationMs;
        let idx = Math.floor(
          (((playbackMs % totalMs) + totalMs) % totalMs) / info.frameDurationMs,
        );
        if (idx < 0) idx = 0;
        if (idx >= info.frameCount) idx = info.frameCount - 1;
        reqRef.current = idx;
        const frameKey = `${src}#${idx}`;
        if (drawnRef.current === frameKey) return;
        const bmp = await getFrameBitmap(src, idx);
        if (cancelled || reqRef.current !== idx) return;
        const cv = canvasRef.current;
        if (!cv) return;
        if (cv.width !== bmp.width || cv.height !== bmp.height) {
          cv.width = bmp.width;
          cv.height = bmp.height;
        }
        cv.getContext("2d")?.drawImage(bmp, 0, 0);
        drawnRef.current = frameKey;
        if (!cancelled) setOk(true);
      } catch {
        if (!cancelled) {
          setOk(false);
          markWebcodecsBroken();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src, playbackMs, canvasRef]);
  return ok;
}

// 다채널(그리드)은 타일이 16~18개 살아 있고, 녹화 모드 틱(150ms)마다 상위 트리가
// 리렌더된다. 타일은 재생 중엔 playbackMs 를 쓰지 않으므로(driveByPlayback=false →
// GIF 자체 재생) 호출부에서 그때 playbackMs 를 null 로 넘기고, 여기서 memo 로 막으면
// 틱마다 타일 16~18개를 재조정하는 일이 아예 없어진다.
function CameraFeedImpl({
  label,
  src,
  paused = false,
  playbackMs = null,
  driveByPlayback = false,
  animate = true,
  fit = "fill",
}: CameraFeedProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const driving = driveByPlayback && playbackMs != null;
  // 캔버스 구동 중엔 디코딩 실패 폴백용으로 <img> 가 필요하므로 그때는 항상 렌더한다.
  const renderImg = animate || driving;

  // 일반(라이브) 모드: GIF의 첫 프레임을 캔버스에 미리 그려두고 paused일 때 표시
  useEffect(() => {
    if (driveByPlayback) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src, driveByPlayback]);

  // 녹화 모드: 타임라인 시각의 프레임을 캔버스에 그린다.
  // 디코딩 실패(iOS Safari 등) 시 decodeOk=false → 애니메이션 GIF로 폴백.
  const decodeOk = useGifFrameCanvas(
    canvasRef,
    src,
    driveByPlayback ? playbackMs : null,
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-900">
      {renderImg && (
        <img
          ref={imgRef}
          src={src}
          alt={label}
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: fit,
            // 녹화 구동 중엔 캔버스를 쓰지만, 디코딩 실패 시 GIF(<img>)로 폴백.
            opacity: driving ? (decodeOk ? 0 : 1) : paused ? 0 : 1,
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: fit,
          // 정지(paused)거나 비활성 페이지(!animate)면 캔버스가 첫 프레임을 맡는다.
          // 활성 페이지에선 위의 <img> 가 GIF 를 재생하므로 캔버스를 숨긴다.
          opacity: driving ? (decodeOk ? 1 : 0) : paused || !animate ? 1 : 0,
        }}
      />

      {/* 스캔라인 효과 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 3px)",
        }}
      />

      {/* 라벨 */}
      <div
        className="absolute inline-flex items-center bg-black/55 text-[10px] font-medium leading-none text-white"
        style={{
          top: "4px",
          left: "4px",
          height: "17px",
          padding: "0 4px",
          borderRadius: "2px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export const CameraFeed = memo(CameraFeedImpl);

export function GridSelectionOverlay({
  visible,
  hideControls = false,
  currentPage = 0,
  totalPages = 2,
  onGallery,
  onMore,
  onAi,
  onMenu,
  edgeInset,
  onFit,
  fit = "fill",
  mode,
  onBack,
  title,
  topInset = 0,
  bottomInset = 12,
  dimAlpha = 0.6,
  topHeight = "25%",
  bottomHeight = "20%",
  showPageIndicator = true,
  swapAiZoom = false,
  auto,
}: {
  visible: boolean;
  /** 딤 그라데이션은 남기고 그 위 버튼·표시만 감출지. 시간바를 끄는 동안
   *  쓴다 — 아래쪽 딤이 같이 사라지면 시간바가 영상 위에 맨몸으로 뜬다
   *  (사용자 지적: "아래쪽 딤은 유지해야지"). */
  hideControls?: boolean;
  currentPage?: number;
  totalPages?: number;
  onGallery?: () => void;
  /** 딤의 '더보기'(⋮). 누르면 안이 더보기 시트를 연다. 안 주면 눌러도 무반응. */
  onMore?: () => void;
  /** AI 버튼을 누를 수 있게 한다. 안 주면 예전처럼 표시만 하는 아이콘. */
  onAi?: () => void;
  /** AI 버튼 왼쪽에 메뉴 버튼을 하나 더 둔다. 안 주면 안 그린다 —
   *  A-2안 가로 화면에서만 쓰는 사양이다(사용자 결정). */
  onMenu?: () => void;
  /** 딤 위 UI 의 좌우 가장자리 여백(px). 안 주면 지금 값 그대로(16). */
  edgeInset?: number;
  /** 화면 맞춤 — 누를 때마다 fill → contain → cover 로 돈다(단일 화면과 동일). */
  onFit?: () => void;
  /** 지금 맞춤 상태. 버튼 아이콘이 이걸 그대로 보여준다. */
  fit?: VideoFit;
  mode?: "live" | "recording";
  onBack?: () => void;
  title?: string;
  /** 딤 상단 아이콘 줄을 아래로 내리는 여백(px). 딤 위에 헤더를 겹쳐 띄우는
   *  안(A-1)에서 헤더 높이만큼 밀어 두 줄로 만드는 용도. 기본 0 = 기존 그대로. */
  topInset?: number;
  /** 딤 하단 줄(메뉴·AI · 페이지 점)이 아래에서 떨어지는 거리(px). 기본 12.
   *  아래에 시간바가 깔리는 안에서 그 위로 띄우는 용도. */
  bottomInset?: number;
  /** 위·아래 그라데이션이 '시작'하는 검정 농도(0~1). 끝은 항상 투명이다.
   *  딤 위에 헤더까지 얹는 A-1 은 글자가 묻혀 더 진하게 쓴다. 기본 0.6 = 기존 그대로. */
  dimAlpha?: number;
  /** 상단 그라데이션 길이(CSS 높이). 헤더까지 얹혀 덮을 게 두 줄인 A-1 은 더 길다.
   *  기본 "25%" = 기존 그대로. */
  topHeight?: string;
  /** 하단 그라데이션 길이(CSS 높이). 기본 "20%" = 기존 그대로.
   *  A-1 단일 화면은 세로에서 33% 를 쓰는데(직접 그린다), 가로도 같은 딤으로
   *  맞추려면 이 값이 필요했다. */
  bottomHeight?: string;
  /** 하단 페이지 인디케이터(점)를 그릴지. 기본 true = 기존 그대로. */
  showPageIndicator?: boolean;
  /** AI 와 크게 보기 자리를 재배치한다 — AI 는 좌하단 원 버튼, 크게 보기는
   *  우하단 원 버튼(AI 가 쓰던 자리), 우상단 줄에선 크게 보기가 빠진다.
   *  A-3안 전용(2026-08-14). 기본 false = 기존 그대로. */
  swapAiZoom?: boolean;
  /** 딤 자동 숨김 핸들(useAutoHide). 주면 아이콘을 만지는 동안 딤을 붙잡고,
   *  떼는 순간부터 5초를 다시 센다. 안 주면 기존 그대로(타이머 안 되돌림). */
  auto?: {
    keepAlive: () => void;
    holdProps: {
      onPointerDown: () => void;
      onPointerUp: () => void;
      onPointerCancel: () => void;
    };
  };
}) {
  // 확대 버튼의 아이콘은 '지금 어디로 가는지'를 보여준다 —
  // 평소면 확대(zoom_in), 이미 커져 있으면 되돌리기(zoom_out).
  const landscape = useDeviceLandscape();
  const immersive = useImmersive();
  return (
    <div
      className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* 상단 딤 그라데이션 */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: topHeight,
          background: `linear-gradient(to bottom, rgba(0,0,0,${dimAlpha}) 0%, rgba(0,0,0,0) 100%)`,
        }}
      />
      {/* 하단 딤 그라데이션 */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: bottomHeight,
          background: `linear-gradient(to top, rgba(0,0,0,${dimAlpha}) 0%, rgba(0,0,0,0) 100%)`,
        }}
      />

      {/* 녹화 모드: 딤 좌측 상단에 뒤로가기 + 타이틀 */}
      {mode === "recording" && (
        <div
          className="absolute flex items-center"
          style={{
            top: `${12 + topInset}px`,
            left: "12px",
            gap: "8px",
            opacity: hideControls ? 0 : 1,
            pointerEvents: visible && !hideControls ? "auto" : "none",
          }}
        >
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          {title && (
            <span className="text-[18px] font-bold leading-none text-white">
              {title}
            </span>
          )}
        </div>
      )}

      {/* 우상단 아이콘 — topInset 이 있으면 그만큼 아래로(헤더 아래 줄).
          아이콘을 누른 건 '영상 탭'이 아니다. 막지 않으면 클릭이 아래 타일까지
          내려가 딤 토글(그리고 230ms 안이면 단일 화면 전환)까지 같이 걸린다.
          누른 순간 딤이 닫혀 버리니 "눌러도 반응이 없다"로 보인다.
          같은 이유로 아이콘을 만지는 동안은 자동 숨김 타이머도 되돌린다 —
          안 그러면 조준하는 사이 5초가 지나 딤이 사라지고, 그때부터 아이콘은
          pointer-events:none 이라 클릭이 영상으로 새어 버린다. */}
      <div
        className="absolute flex items-center gap-0 text-white"
        style={{
          top: `${12 + topInset}px`,
          right: `${edgeInset ?? 16}px`,
          opacity: hideControls ? 0 : 1,
        }}
        onClick={(e) => {
          e.stopPropagation();
          auto?.keepAlive();
        }}
        {...(auto?.holdProps ?? {})}
      >
        <button
          type="button"
          aria-label="갤러리"
          className="px-1.5 py-2"
          onClick={onGallery}
          style={{ pointerEvents: visible ? "auto" : "none" }}
        >
          <OverlayIcon
            src={`${BASE}/ic_list_gallery.svg`}
            size={28}
          />
        </button>
        {/* 화면 맞춤 — 단일 화면과 같은 자리·같은 아이콘. 그리드 타일 전체에 걸린다. */}
        <button
          type="button"
          aria-label="화면 맞춤"
          className="px-1.5 py-2"
          onClick={onFit}
          style={{ pointerEvents: visible ? "auto" : "none" }}
        >
          <OverlayIcon src={videoFitIcon(BASE, nextVideoFit(fit))} size={28} />
        </button>
        {/* 크게 보기 — 상태바·헤더·하단 탭바·안드로이드 내비를 걷고 영상만 화면을
            꽉 채운다(immersive.ts). 회전이 아니라 '지금 방향 그대로 키우기'다.
            이미 가로로 눕혀 둔 상태면 그건 세로로 되돌리는 버튼이 된다 —
            버튼 뜻은 늘 '크게 ↔ 원래대로' 하나로 읽힌다.
            swapAiZoom(A-3)이면 이 줄에선 빠지고 우하단 원 버튼으로 내려간다. */}
        {!swapAiZoom && (
          <button
            type="button"
            aria-label={landscape || immersive ? "원래 크기로" : "크게 보기"}
            className="px-1.5 py-2"
            // 언제나 '크게 보기 ↔ 원래대로'다. 방향은 확대가 알아서 정한다
            // (immersive.ts) — 회전은 좌측 패널의 몫이고 이 버튼과 무관하다.
            onClick={toggleImmersive}
            style={{ pointerEvents: visible ? "auto" : "none" }}
          >
            <OverlayIcon
              src={`${BASE}/${landscape || immersive ? "zoom_out" : "zoom_in"}.svg`}
              size={28}
            />
          </button>
        )}
        {/* 더보기 — 누르면 바텀시트(상세 설정·원격 지원 요청·방문 지원 요청).
            시트는 안이 들고 있으므로 여기선 열어 달라고만 한다. */}
        <button
          type="button"
          aria-label="더보기"
          className="px-1.5 py-2"
          onClick={onMore}
          style={{ pointerEvents: visible ? "auto" : "none" }}
        >
          <OverlayIcon src={`${BASE}/nav/etc.svg`} size={28} />
        </button>
      </div>

      {/* AI 아이콘 — 딤 오른쪽 아래. 30px 원으로 감싼다(플레이어 버튼과 같은
          결: 반투명 검정 + 흰 테두리). 원본이 이미 흰색이라 마스크·필터는 없다.
          페이지 인디케이터와 같은 높이(bottom 12)에 앉혀 한 줄로 읽히게 했다.
          onAi 를 준 안에서만 누를 수 있다 — 안 준 안(A-2·B)은 예전처럼 표시만.
          시트는 안이 들고 있으므로 여기선 열어 달라고만 한다(더보기와 같은 결). */}
      {/* z-10 — 아래 시간바 층(LandscapeVideo 의 statusBottom)이 이 줄보다
          나중에 그려져 같은 높이에서 클릭을 먼저 가져간다(사용자 지적: "시간바
          드래그 때문에 AI 버튼이 안 눌리는 것 같아"). 껍데기는 이미 통과시키고
          있지만 시간바 자체는 폭을 다 쓰므로, 겹치는 34px 만큼은 버튼이 이긴다. */}
      <div
        className="absolute z-10 flex items-center gap-2"
        style={{
          right: `${edgeInset ?? 16}px`,
          bottom: `${bottomInset}px`,
          opacity: hideControls ? 0 : 1,
        }}
      >
        {/* 메뉴 — AI 옆, 같은 원 스타일. onMenu 를 준 안에서만 나온다. */}
        {onMenu && (
          <button
            type="button"
            aria-label="메뉴"
            onClick={onMenu}
            className="flex items-center justify-center rounded-full"
            style={{
              width: "34px",
              height: "34px",
              border: "1px solid rgba(255,255,255,0.35)",
              backgroundColor: "rgba(0,0,0,0.35)",
              pointerEvents: visible ? "auto" : "none",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        )}
        {/* swapAiZoom(A-3)이면 이 원 자리에 크게 보기가 온다 — AI 는 위 줄로. */}
        {swapAiZoom ? (
          <button
            type="button"
            aria-label={landscape || immersive ? "원래 크기로" : "크게 보기"}
            onClick={toggleImmersive}
            className="flex items-center justify-center rounded-full text-white"
            style={{
              width: "34px",
              height: "34px",
              border: "1px solid rgba(255,255,255,0.35)",
              backgroundColor: "rgba(0,0,0,0.35)",
              pointerEvents: visible && !hideControls ? "auto" : "none",
            }}
          >
            <OverlayIcon
              src={`${BASE}/${landscape || immersive ? "zoom_out" : "zoom_in"}.svg`}
              size={24}
            />
          </button>
        ) : (
          <button
            type="button"
            aria-label="AI 검색"
            aria-hidden={!onAi}
            onClick={onAi}
            className="flex items-center justify-center rounded-full"
            style={{
              width: "34px",
              height: "34px",
              border: "1px solid rgba(255,255,255,0.35)",
              backgroundColor: "rgba(0,0,0,0.35)",
              pointerEvents: onAi && visible && !hideControls ? "auto" : "none",
            }}
          >
            <img src={`${BASE}/ai_Icon.svg`} alt="" className="h-7 w-7" />
          </button>
        )}
      </div>

      {/* swapAiZoom(A-3): AI 원 버튼은 딤 왼쪽 아래 — 우하단(크게 보기)과 같은
          원 스타일, 페이지 인디케이터와 같은 높이. z-10 이유는 우하단 줄과 동일. */}
      {swapAiZoom && (
        <div
          className="absolute z-10"
          style={{
            left: `${edgeInset ?? 16}px`,
            bottom: `${bottomInset}px`,
            opacity: hideControls ? 0 : 1,
          }}
        >
          <button
            type="button"
            aria-label="AI 검색"
            aria-hidden={!onAi}
            onClick={onAi}
            className="flex items-center justify-center rounded-full"
            style={{
              width: "34px",
              height: "34px",
              border: "1px solid rgba(255,255,255,0.35)",
              backgroundColor: "rgba(0,0,0,0.35)",
              pointerEvents: onAi && visible && !hideControls ? "auto" : "none",
            }}
          >
            <img src={`${BASE}/ai_Icon.svg`} alt="" className="h-7 w-7" />
          </button>
        </div>
      )}

      {/* 하단 페이지 인디케이터 */}
      {showPageIndicator && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: `${bottomInset}px`, opacity: hideControls ? 0 : 1 }}
        >
          <div
            className="inline-flex items-center gap-1.5 rounded-full bg-black/45"
            style={{ height: "24px", padding: "0 10px" }}
          >
            {computeVisibleOffsets(currentPage, totalPages).map((offset) => {
              const size = DOT_SIZE_BY_ABS_OFFSET[
                Math.min(Math.abs(offset), DOT_SIZE_BY_ABS_OFFSET.length - 1)
              ];
              const isActive = offset === 0;
              return (
                <span
                  key={currentPage + offset}
                  className="rounded-full transition-all duration-200 ease-out"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: isActive
                      ? "rgba(255,255,255,1)"
                      : "rgba(255,255,255,0.45)",
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const MAX_INDICATOR_DOTS = 7;
const DOT_SIZE_BY_ABS_OFFSET = [6, 5, 4, 3, 2];

function computeVisibleOffsets(active: number, total: number): number[] {
  const desired = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const visible = desired.filter((o) => active + o >= 0 && active + o < total);
  while (visible.length > MAX_INDICATOR_DOTS) {
    if (Math.abs(visible[0]) >= Math.abs(visible[visible.length - 1])) {
      visible.shift();
    } else {
      visible.pop();
    }
  }
  return visible;
}

function OverlayIcon({ src, size = 24 }: { src: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="block bg-current"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
