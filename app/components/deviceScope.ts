"use client";

import { createContext, useContext } from "react";

// 이 트리가 '어느 기기'에 그려지고 있는가. 0 = 시안(오른쪽), 1~3 = 비교 자리.
//
// 비교 자리마다 해상도를 따로 고를 수 있게 되면서(compareSize.ts) 필요해졌다.
// 크기 자체는 CSS 가 알아서 갈라 준다(자리 프레임에서 --device-w/h 를 덮어쓴다).
// 문제는 폭을 '읽어서' 배치를 정하는 쪽이다 — useDeviceWidth 는 문서 루트의
// --device-w 를 보므로, 그대로 두면 비교 기기 안의 안이 시안 폭 기준으로
// 배치를 계산한다(CSS 는 405 로 그렸는데 JS 는 360 인 줄 안다).
//
// 그래서 자리 안쪽 트리는 이 컨텍스트로 자기 번호를 물려받고, 폭·세로를 읽을 때
// --dev1-w 처럼 그 자리 변수를 본다.
/** 0 = 시안(오른쪽), 1~3 = 왼쪽 비교 자리(CompareSlot 과 같은 번호).
 *  자리 수를 늘릴 땐 compareTarget.ts 의 MAX_COMPARE_SLOTS 와 같이 늘린다. */
export type DeviceScope = 0 | 1 | 2 | 3;

export const DeviceScopeContext = createContext<DeviceScope>(0);

export const useDeviceScope = () => useContext(DeviceScopeContext);
