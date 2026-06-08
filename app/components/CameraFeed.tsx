import { useEffect, useRef, useState } from "react";

type CameraFeedProps = {
  label: string;
  src: string;
  zoom?: number;
  paused?: boolean;
  // 녹화 모드: 타임라인 시각(playbackMs)에 해당하는 프레임을 직접 그려
  // 배속/되감기/탐색이 영상에도 반영되게 한다.
  playbackMs?: number | null;
  driveByPlayback?: boolean;
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
        const bmp = await getFrameBitmap(src, idx);
        if (cancelled || reqRef.current !== idx) return;
        const cv = canvasRef.current;
        if (!cv) return;
        if (cv.width !== bmp.width || cv.height !== bmp.height) {
          cv.width = bmp.width;
          cv.height = bmp.height;
        }
        cv.getContext("2d")?.drawImage(bmp, 0, 0);
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

export function CameraFeed({
  label,
  src,
  paused = false,
  playbackMs = null,
  driveByPlayback = false,
}: CameraFeedProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const driving = driveByPlayback && playbackMs != null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-900">
      <img
        ref={imgRef}
        src={src}
        alt={label}
        className="absolute inset-0 h-full w-full object-fill"
        style={{
          transform: "scale(1.1)",
          // 녹화 구동 중엔 캔버스를 쓰지만, 디코딩 실패 시 GIF(<img>)로 폴백.
          opacity: driving ? (decodeOk ? 0 : 1) : paused ? 0 : 1,
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          objectFit: "fill",
          transform: "scale(1.1)",
          opacity: driving ? (decodeOk ? 1 : 0) : paused ? 1 : 0,
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

export function GridSelectionOverlay({
  visible,
  currentPage = 0,
  totalPages = 2,
  onGallery,
  mode,
  onBack,
  title,
}: {
  visible: boolean;
  currentPage?: number;
  totalPages?: number;
  onGallery?: () => void;
  mode?: "live" | "recording";
  onBack?: () => void;
  title?: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* 상단 딤 그라데이션 */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: "25%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
        }}
      />
      {/* 하단 딤 그라데이션 */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "20%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* 녹화 모드: 딤 좌측 상단에 뒤로가기 + 타이틀 */}
      {mode === "recording" && (
        <div
          className="absolute flex items-center"
          style={{
            top: "12px",
            left: "12px",
            gap: "8px",
            pointerEvents: visible ? "auto" : "none",
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

      {/* 우상단 아이콘 */}
      <div className="absolute right-4 top-3 flex items-center gap-3 text-white">
        <button
          type="button"
          aria-label="갤러리"
          onClick={onGallery}
          style={{ pointerEvents: visible ? "auto" : "none" }}
        >
          <OverlayIcon
            src="/ic_list_gallery.svg"
            size={32}
          />
        </button>
        <OverlayIcon src="/nav/rotate.svg" size={32} />
        <OverlayIcon src="/nav/etc.svg" size={32} />
      </div>

      {/* 하단 페이지 인디케이터 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
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
