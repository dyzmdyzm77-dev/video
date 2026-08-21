// ============================================================================
// 하루치 가상 움직임-감지 이벤트 — 네 안이 같이 쓴다
// ============================================================================
// 원래는 안(VariantA/A1/A3/B)마다 같은 코드를 복사해 두고 있었다. A·A-1·A-3 는
// 글자까지 같아 결과도 같았지만, B 만 유형(kind)을 안 뽑느라 rng 호출 수가 달라
// '같은 하루'인데도 이벤트 시각이 미묘하게 달랐다. 클라우드 이벤트 목록
// (CloudEventSheet)이 안에 상관없이 같은 목록을 보여야 해서 여기로 합쳤다.
//
// 시드가 고정이라 언제 열어도 같은 하루가 나온다 — 스크린샷을 비교할 수 있어야
// 하는 프로토타입이라 이게 중요하다.
// ============================================================================

// 시간대별 상대 활동량(0~23시) — 클수록 이벤트가 촘촘하다. 심야 한산, 출퇴근·저녁 붐빔.
const HOURLY_ACTIVITY = [
  3, 2, 2, 2, 2, 3, // 0-5시 심야
  5, 8, 9, 8, 7, 7, // 6-11시 오전
  8, 7, 7, 7, 8, 9, // 12-17시 오후
  10, 9, 8, 6, 5, 4, // 18-23시 저녁
];

// 시드 기반 PRNG — 매 렌더마다 동일한 랜덤 분포 보장
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 감지 유형 — 썸네일 위 칩(EventKindChip)에 쓴다. 대부분은 단순 '움직임'이고
// 이상 상황은 드물게 섞인다(넘어짐 > 폭행). 실제 분포를 흉내 낸 값이라, 화면을
// 훑을 때 빨간 칩이 드문드문 보이는 정도가 된다.
export const EVENT_KINDS = ["움직임", "넘어짐", "폭행"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
function pickKind(r: number): EventKind {
  if (r < 0.86) return "움직임";
  if (r < 0.95) return "넘어짐";
  return "폭행";
}

// 가상 이벤트 — 자정부터 하루를 연속으로 걸으며 '묶음' 단위로 배치한다.
// at: 자정 기준 초 오프셋, dur: 영상 길이(초). dur 로 타임라인 막대 길이를 그린다.
//
// 설계 의도(두 가지를 동시에 만족):
//  1) 빽빽한 리본 — 활동 시간대 평균 ~16~24초 간격이라 기본 줌에서도 화면이 썸네일로 찬다.
//  2) 상식적인 겹침 — 한 묶음은 1개(78%)·2개(18%)·3개(4%)뿐이고, 멤버는 4~8초 간격.
//     다음 묶음은 마지막 멤버에서 최소 16초 떨어뜨려 '격리'하므로 묶음끼리는 절대 붙지 않는다
//     → 같은 1초에 떼박히거나 4개 이상 겹치는 비상식적 분포가 구조적으로 불가능.
export const TIMELINE_EVENTS = (() => {
  const rng = mulberry32(20260529);
  const arr: { at: number; dur: number; kind: EventKind }[] = [];
  let t = 0;
  while (t < 86400) {
    const h = Math.min(23, Math.floor(t / 3600));
    // 활동량이 높을수록 평균 간격이 짧다(12초) ~ 한산할수록 길다(30초). 하루 ~4900건.
    const meanGap = 12 + (30 - 12) * (1 - (HOURLY_ACTIVITY[h] - 2) / 8);
    const r = rng();
    const size = r < 0.78 ? 1 : r < 0.96 ? 2 : 3; // 묶음 크기
    let last = t;
    // 4~15초. 유형은 같은 rng 에서 뽑아 매번 같은 하루가 나오게 한다.
    arr.push({
      at: Math.round(t),
      dur: 4 + Math.floor(rng() * 12),
      kind: pickKind(rng()),
    });
    for (let k = 1; k < size; k++) {
      last += 4 + Math.floor(rng() * 5); // 묶음 내 멤버 간 4~8초
      arr.push({
        at: Math.round(last),
        dur: 4 + Math.floor(rng() * 12),
        kind: pickKind(rng()),
      });
    }
    // 다음 묶음 시작 — 마지막 멤버에서 ≥16초 떨어뜨려 묶음을 격리.
    t = last + Math.max(16, Math.round(meanGap * (0.5 + rng())));
  }
  return arr.sort((a, b) => a.at - b.at);
})();
