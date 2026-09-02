"use client";

import { BASE } from "../basePath";
import { BOTTOM_SHEET, OPTION_ROW } from "./designTokens";

// ============================================================================
// 하나만 고르는 바텀시트 — 디자인시스템 Bottom Sheet(Footer=None)
// ============================================================================
// 클라우드 녹화 화면의 필터 칩(카메라 · 감지유형)을 누르면 뜬다. 확인 버튼이
// 없다 — 고르는 즉시 닫힌다(Footer=None 변형이 그렇게 생겼다. 확인·취소가
// 붙는 Footer=Single/Dual 은 여러 개를 골라 놓고 한 번에 적용할 때 쓴다).
//
// 겉모습(딤·올라오는 애니메이션·기준 컨테이너)은 `DateTimePickerSheet` 와
// 똑같이 맞췄다 — 같은 화면에서 칩 셋 중 어느 것을 눌러도 같게 움직여야 한다.
// 안쪽 치수만 디자인시스템 Bottom Sheet / Bottom Sheet Option 값이다.
// ============================================================================

export type Option = { key: string; label: string };

export default function OptionSheet({
  open,
  title,
  options,
  value,
  onClose,
  onPick,
}: {
  open: boolean;
  /** 시트 헤더에 적히는 이름. 누른 칩의 제목과 같게 넘긴다. */
  title: string;
  options: Option[];
  /** 지금 골라져 있는 항목의 key. */
  value: string;
  onClose: () => void;
  onPick: (key: string) => void;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: open ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        className={`absolute inset-x-0 mx-auto flex w-full max-w-[480px] flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "pointer-events-auto" : ""
        }`}
        style={{
          bottom: 0,
          backgroundColor: BOTTOM_SHEET.bg,
          borderTopLeftRadius: `${BOTTOM_SHEET.radiusTop}px`,
          borderTopRightRadius: `${BOTTOM_SHEET.radiusTop}px`,
          paddingTop: `${BOTTOM_SHEET.paddingTop}px`,
          paddingBottom: `${BOTTOM_SHEET.paddingBottom}px`,
          transform: open ? "translateY(0%)" : "translateY(100%)",
          // 닫혔을 땐 그림자를 끈다 — 시트 윗변이 화면 하단에 걸쳐 그림자가
          // 화면 안쪽으로 새어 올라온다(DateTimePickerSheet 와 같은 이유).
          boxShadow: open ? undefined : "none",
        }}
      >
        <div
          className="flex flex-none items-center justify-between"
          style={{
            padding: `0 ${BOTTOM_SHEET.headerPaddingX}px`,
            marginBottom: `${BOTTOM_SHEET.contentGap}px`,
          }}
        >
          <h2
            className="leading-none"
            style={{
              fontSize: `${BOTTOM_SHEET.titleFontSize}px`,
              fontWeight: BOTTOM_SHEET.titleFontWeight,
              color: BOTTOM_SHEET.titleColor,
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: `${BOTTOM_SHEET.closeSize}px`,
              height: `${BOTTOM_SHEET.closeSize}px`,
            }}
          >
            <img
              src={`${BASE}/close.svg`}
              alt=""
              style={{
                width: `${BOTTOM_SHEET.closeSize}px`,
                height: `${BOTTOM_SHEET.closeSize}px`,
              }}
            />
          </button>
        </div>

        {/* 항목이 많으면(카메라가 늘어나면) 목록만 구른다. 시트가 화면을 다
            덮지 않도록 높이를 절반으로 묶는다. */}
        <div
          className="min-h-0 overflow-y-auto"
          style={{ maxHeight: "50vh" }}
          role="radiogroup"
          aria-label={title}
        >
          {options.map((o) => {
            const on = o.key === value;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onPick(o.key)}
                className="flex w-full items-center text-left"
                style={{
                  height: `${OPTION_ROW.height}px`,
                  padding: `0 ${OPTION_ROW.paddingX}px`,
                  gap: `${OPTION_ROW.gap}px`,
                  fontSize: `${OPTION_ROW.fontSize}px`,
                  fontWeight: OPTION_ROW.fontWeight,
                  color: OPTION_ROW.color,
                }}
              >
                <span
                  aria-hidden
                  className="flex flex-none items-center justify-center rounded-full"
                  style={{
                    width: `${OPTION_ROW.radio}px`,
                    height: `${OPTION_ROW.radio}px`,
                    border: `1px solid ${
                      on ? OPTION_ROW.radioBorderSelected : OPTION_ROW.radioBorder
                    }`,
                  }}
                >
                  {on && (
                    <span
                      className="rounded-full"
                      style={{
                        width: `${OPTION_ROW.radioDot}px`,
                        height: `${OPTION_ROW.radioDot}px`,
                        backgroundColor: OPTION_ROW.radioDotColor,
                      }}
                    />
                  )}
                </span>
                <span className="min-w-0 truncate">{o.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

