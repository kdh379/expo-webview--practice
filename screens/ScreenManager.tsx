/**
 * 네이티브 스크린 관리자
 *
 * 모든 네이티브 스크린(모달)을 관리하는 컴포넌트입니다.
 * 스크린의 표시/숨김과 결과 처리를 관리합니다.
 */

import React, { createContext, useContext, useState } from "react";

import { SCREENS } from "./config";

import type { ScreenController } from "./types";

// 스크린 컨텍스트 타입 정의
interface ScreenContextType {
  screenController: ScreenController;
  sendResponse: (id: string, data: any) => void;
}

// 스크린 컨텍스트 생성
const ScreenContext = createContext<ScreenContextType | null>(null);

// 스크린 컨텍스트 사용을 위한 훅
export const useScreens = () => {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error("useScreens must be used within a ScreenManager");
  }
  return context;
};

// WebView에서 사용할 스크린 관리자 컴포넌트 타입
interface ScreenManagerProps {
  children: React.ReactNode;
  sendResponse: (id: string, data: any) => void;
  sendErrorResponse: (id: string, error: string) => void;
}

// 활성화된 스크린 State
interface ActiveScreen<T extends BridgeType = BridgeType> {
  id: string; // 메시지 ID
  name: BridgeType; // 스크린 이름
  payload: bridges[T]["payload"];
}

/**
 * 스크린 관리자 컴포넌트
 */
const ScreenManager: React.FC<ScreenManagerProps> = ({
  children,
  sendResponse,
  sendErrorResponse,
}) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen | null>(null);

  // 스크린 컨트롤러 구현
  const screenController: ScreenController = {
    // 스크린 표시
    showScreen: (name, id, payload = {}) => {
      const screenConfig = SCREENS[name];
      if (!screenConfig) {
        console.error(`스크린 설정을 찾을 수 없습니다: ${name}`);
        return false;
      }

      // 스크린 활성화
      setActiveScreen({
        id,
        name,
        payload: { ...screenConfig.defaultOptions, ...payload },
      });

      return true;
    },

    // 스크린 닫기
    closeScreen: (result?: any) => {
      if (!activeScreen) return;

      if (result) {
        // 성공 응답
        sendResponse(activeScreen.id, result);
      } else {
        // 에러 응답
        sendErrorResponse(activeScreen.id, "스크린이 취소되었습니다.");
      }

      // 스크린 비활성화
      setActiveScreen(null);
    },
  };

  // 모달 표시 여부와 컴포넌트 동적 결정
  const renderActiveScreen = () => {
    if (!activeScreen) return null;

    const { name, payload } = activeScreen;
    const config = SCREENS[name];
    if (!config) return null;

    const ScreenComponent = config.component;

    return (
      <ScreenComponent
        visible={true}
        payload={payload}
        onClose={() => screenController.closeScreen()}
        onComplete={(result: any) => screenController.closeScreen(result)}
      />
    );
  };

  return (
    <ScreenContext.Provider value={{ screenController, sendResponse }}>
      {children}
      {renderActiveScreen()}
    </ScreenContext.Provider>
  );
};

export default ScreenManager;
