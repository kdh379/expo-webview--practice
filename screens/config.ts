/**
 * 스크린 설정 파일
 *
 * 모든 네이티브 스크린 설정을 이 파일에서 관리합니다.
 * 새로운 스크린을 추가할 때는 여기에 추가하기만 하면 됩니다.
 */

import { CameraModal } from "@/features/camera";
import { OCRModal } from "@/features/ocr";
import type { ScreenComponentProps } from "@/screens/types";

type ScreenConfig = {
  [T in BridgeType]?: {
    component: React.ComponentType<ScreenComponentProps>;
    defaultOptions?: Record<string, unknown>;
  };
};

// 스크린 목록 맵
export const SCREENS: ScreenConfig = {
  // 카메라 스크린
  CAMERA_SHOW: {
    component: CameraModal,
    defaultOptions: {
      mode: "photo",
      quality: "high",
    },
  },

  // OCR 스크린
  OCR: {
    component: OCRModal,
    defaultOptions: {
      documentType: "ID_CARD",
      includeImage: true,
    },
  },

  // 새로운 스크린을 추가할 때는 여기에 설정을 추가하면 됩니다.
  // 예: NEW_FEATURE: { type: 'NEW_FEATURE_SHOW', component: NewFeatureModal, defaultOptions: {} },
};
