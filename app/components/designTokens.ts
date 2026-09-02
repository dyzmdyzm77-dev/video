// ============================================================================
// 디자인 토큰 — Figma 디자인시스템에서 그대로 옮긴 값
// ============================================================================
// 출처는 Figma 파일 "지훈 실험실"(fileKey `rmdLretmsZGZfEbUGqlvPX`)의
// **디자인시스템** 페이지(node `3337:11907`). 2026-09-02 에 읽었다.
// 변수 컬렉션 셋에서 왔다 —
//   · Foundation V2      (283) 원시값. gray/blue/red 스케일, spacing, radius, font
//   · Semantic Color V2  (170) 의미 이름 → 원시값 별칭. Light/Dark 두 모드
//   · Semantic Number V2  (10) radius/spacing 의 의미 이름
//
// **여기 있는 숫자를 눈대중으로 고치지 말 것.** 프로토타입이 UT 에 쓰이는데
// 실제 앱 디자인 시스템과 어긋나 보이면 안 된다. 값을 바꿔야 하면 Figma 쪽을
// 먼저 보고, 그 페이지의 값을 다시 옮겨 적는다.
//
// 원시값을 통째로 옮기지는 않았다 — 지금 쓰는 것만 있다. 새 색이 필요하면
// Figma 에서 확인해 이 파일에 추가하고 쓸 것(컴포넌트 안에 hex 를 다시
// 흩뿌리지 말 것 — 그러다 #F4F5F7 · #EBEBEB · #E0E0E0 처럼 토큰에서 한두 칸씩
// 어긋난 값들이 생겼다).
//
// Light 모드만 옮겼다. 이 앱은 다크 모드를 아직 안 쓴다 — 쓰게 되면
// Semantic Color V2 의 Dark 모드를 같은 이름으로 한 벌 더 옮기면 된다.
// ============================================================================

/** Foundation V2 — 원시 색. 이름은 Figma 변수 이름 그대로다. */
export const PRIMITIVE = {
  white: "#FFFFFF",
  gray0: "#FAFAFA",
  gray50: "#F5F5F5",
  gray100: "#E9E9E9",
  gray200: "#D9D9D9",
  gray300: "#C4C4C4",
  gray400: "#9D9D9D",
  gray500: "#757575",
  gray600: "#555555",
  gray800: "#353535",
  gray900: "#202020",
  blue50: "#E2F1FF",
  blue400: "#1D6CEB",
  blue500: "#2747B9",
} as const;

/** Semantic Color V2 — 의미 이름. 위 원시값의 별칭이다. */
export const COLOR = {
  /** color/bg/level-0 */ bgLevel0: PRIMITIVE.white,
  /** color/bg/level-1 */ bgLevel1: PRIMITIVE.gray0,
  /** color/bg/level-2 */ bgLevel2: PRIMITIVE.gray50,

  /** color/text/title/primary · color/text/body/primary */
  textPrimary: PRIMITIVE.gray900,
  /** color/text/body/secondary */ textSecondary: PRIMITIVE.gray800,
  /** color/text/body/tertiary · color/text/state/caption */
  textTertiary: PRIMITIVE.gray500,
  /** color/text/state/helper */ textHelper: PRIMITIVE.gray400,
  /** color/text/state/accent */ textAccent: PRIMITIVE.blue400,
  /** color/text/state/accent-inverse */ textOnAccent: PRIMITIVE.white,

  /** color/line/gray/subtle — 화면을 가르는 얇은 선 */
  lineSubtle: PRIMITIVE.gray100,
  /** color/line/blue */ lineAccent: PRIMITIVE.blue400,

  /** color/icon/gray-dark */ iconStrong: PRIMITIVE.gray800,
  /** color/icon/gray-light */ iconWeak: PRIMITIVE.gray300,
} as const;

/** Semantic Number V2 + Foundation V2 의 radius 스케일. */
export const RADIUS = {
  /** radius/control/sm · radius/button/md */ button: 4,
  /** radius/modal/md */ modal: 8,
  /** radius/card/md */ card: 10,
  /** radius/full — 칩처럼 완전히 둥근 것 */ full: 9999,
} as const;

/** Foundation V2 spacing 스케일. 여기 없는 숫자(5·7·11 같은)는 쓰지 말 것. */
export const SPACE = {
  s2: 2,
  s4: 4,
  s6: 6,
  s8: 8,
  s10: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s20: 20,
  s24: 24,
  s40: 40,
} as const;

/** Foundation V2 타이포. line-height 는 130% 한 값만 쓴다(140% 는 본문 단락용). */
export const TYPE = {
  size: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 20 },
  weight: { regular: 400, medium: 500, bold: 700 },
  /** line-height/130 */ leading: 1.3,
} as const;

// ============================================================================
// 컴포넌트 스펙 — 디자인시스템 컴포넌트의 Mobile 변형에서 그대로 옮긴 치수
// ============================================================================
// 안드로이드/아이폰 프로토타입이라 Break=Mobile 변형만 옮겼다. Mobile 에 없는
// 크기는 아예 쓰지 않는다 — 예를 들어 Chip 은 Mobile 에 SM 밖에 없고(MD 는 PC
// 전용), Button 은 Mobile 에 LG 밖에 없다.

/** Chip (component set `3337:14956`) — Size=SM, Break=Mobile.
 *  한 번에 하나를 고르는 필터 칩. Solid 는 고른 게 파랗게 차고, Line 은
 *  테두리·글자만 파래진다. 이 화면은 Solid 를 쓴다(고른 칩이 멀리서도 보인다). */
export const CHIP = {
  height: 30,
  radiusToken: RADIUS.full,
  paddingX: 12,
  fontSize: TYPE.size.md,
  fontWeight: TYPE.weight.medium,
  line: {
    default: { bg: PRIMITIVE.white, border: PRIMITIVE.gray300, label: PRIMITIVE.gray500 },
    selected: { bg: PRIMITIVE.white, border: PRIMITIVE.blue400, label: PRIMITIVE.blue400 },
  },
  solid: {
    default: { bg: PRIMITIVE.gray50, border: PRIMITIVE.gray50, label: PRIMITIVE.gray800 },
    selected: { bg: PRIMITIVE.blue400, border: PRIMITIVE.blue400, label: PRIMITIVE.white },
  },
} as const;

/** Filter Chip (component set `3337:24331`) — Size=MD, Break=Mobile, Variant=Line,
 *  Title=Off. 값이 적히고 오른쪽에 화살표가 붙는, 눌러서 고르는 칩.
 *  Chip 과 달리 오른쪽 여백이 좁다(화살표가 그 자리를 쓴다). */
export const FILTER_CHIP = {
  height: 30,
  radiusToken: RADIUS.full,
  paddingLeft: 12,
  paddingRight: 6,
  gap: 4,
  chevron: 20,
  fontSize: TYPE.size.md,
  fontWeight: TYPE.weight.medium,
  bg: PRIMITIVE.white,
  border: PRIMITIVE.gray300,
  label: PRIMITIVE.gray500,
  /** Title=On 일 때 왼쪽 제목(회색) · 오른쪽 지금 값(파랑). 값이 파래서
   *  '이 필터에 뭐가 걸려 있는지'가 칩만 보고도 읽힌다. */
  title: PRIMITIVE.gray500,
  value: PRIMITIVE.blue400,
} as const;

/** Bottom Sheet (component set `3337:23624`) — Footer=None.
 *  제목 한 줄 + 고를 항목 목록만 있는 시트. 확인 버튼이 없다 — 고르는 즉시
 *  닫힌다(Footer=Single/Dual 은 확인·취소가 붙는 변형이다). */
export const BOTTOM_SHEET = {
  /** radius/modal/md — 위 두 모서리만 */ radiusTop: RADIUS.modal,
  paddingTop: 20,
  paddingBottom: 40,
  /** 헤더와 목록 사이 */ contentGap: 24,
  headerPaddingX: 20,
  titleFontSize: TYPE.size.xxl,
  titleFontWeight: TYPE.weight.bold,
  titleColor: PRIMITIVE.gray900,
  closeSize: 24,
  bg: PRIMITIVE.white,
} as const;

/** Bottom Sheet Option (component set `3337:23486`) — Type=Radio.
 *  한 번에 하나만 고르는 목록 한 줄. 체크박스형(다중)도 있지만 이 화면의
 *  필터는 하나만 고른다. */
export const OPTION_ROW = {
  height: 48,
  paddingX: 20,
  gap: 8,
  fontSize: TYPE.size.lg,
  fontWeight: TYPE.weight.medium,
  color: PRIMITIVE.gray900,
  radio: 18,
  radioDot: 10,
  radioBorder: PRIMITIVE.gray200,
  radioBorderSelected: PRIMITIVE.blue400,
  radioDotColor: PRIMITIVE.blue400,
} as const;

/** Search Input (component set `3337:18448`) — Size=MD.
 *  Break 축이 없다(모바일·PC 공용). 알약이 아니라 살짝 둥근 사각형이고,
 *  회색으로 채우는 게 아니라 흰 바탕에 테두리다. */
export const SEARCH_INPUT = {
  height: 44,
  radiusToken: RADIUS.button,
  paddingLeft: 16,
  paddingRight: 12,
  fontSize: TYPE.size.md,
  fontWeight: TYPE.weight.regular,
  bg: PRIMITIVE.white,
  border: PRIMITIVE.gray200,
  /** color/form-control/text/placeholder */ placeholder: PRIMITIVE.gray500,
  /** color/form-control/text/default */ text: PRIMITIVE.gray800,
  icon: PRIMITIVE.gray500,
} as const;

/** Button (component set `3337:14195`) — Size=LG, Break=Mobile.
 *  Mobile 에는 LG 하나뿐이다. 48 높이 · radius 4 · 16 Medium. */
export const BUTTON = {
  height: 48,
  radiusToken: RADIUS.button,
  paddingX: 16,
  fontSize: TYPE.size.lg,
  fontWeight: TYPE.weight.medium,
  primary: { bg: PRIMITIVE.blue400, border: PRIMITIVE.blue400, label: PRIMITIVE.white },
  secondary: { bg: PRIMITIVE.white, border: PRIMITIVE.gray200, label: PRIMITIVE.gray800 },
} as const;
