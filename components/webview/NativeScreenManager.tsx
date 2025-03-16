import React, { createContext, useContext, useState } from "react";

import CameraModal from "../CameraModal";
import OCRModal from "../OCRModal";

import type { ScreenController } from "./handlers/screenHandlers";

// 메시지 타입 참조 (전역 타입 사용)
// MessageType은 bridge.d.ts에 정의되어 있음

// 네이티브 스크린 컨텍스트 타입 정의
interface NativeScreenContextType {
  screenController: ScreenController;
  sendResponse: (id: string, data: any) => void;
}

// 네이티브 스크린 컨텍스트 생성
const NativeScreenContext = createContext<NativeScreenContextType | null>(null);

// 네이티브 스크린 컨텍스트 사용을 위한 훅
export const useNativeScreens = () => {
  const context = useContext(NativeScreenContext);
  if (!context) {
    throw new Error(
      "useNativeScreens must be used within a NativeScreenManager",
    );
  }
  return context;
};

interface NativeScreenManagerProps {
  children: React.ReactNode;
  sendResponse: (id: string, data: any) => void;
}

interface CameraState {
  visible: boolean;
  callbackId: string;
}

interface OCRState {
  visible: boolean;
  callbackId: string;
  options?: OCRPayload;
}

// 네이티브 스크린 관리자 컴포넌트
const NativeScreenManager: React.FC<NativeScreenManagerProps> = ({
  children,
  sendResponse,
}) => {
  // 카메라 모달 상태 관리
  const [cameraState, setCameraState] = useState<CameraState>({
    visible: false,
    callbackId: "",
  });

  // OCR 모달 상태 관리
  const [ocrState, setOcrState] = useState<OCRState>({
    visible: false,
    callbackId: "",
    options: undefined,
  });

  // 카메라 모달 닫기 핸들러
  const handleCloseCamera = (result?: CameraResult) => {
    if (cameraState.callbackId) {
      if (result) {
        setCameraState({
          visible: false,
          callbackId: "",
        });
        sendResponse(cameraState.callbackId, result);
      } else {
        sendResponse(cameraState.callbackId, {
          error: "카메라가 취소되었습니다.",
        });
      }
    }

    setCameraState({
      visible: false,
      callbackId: "",
    });
  };

  // OCR 모달 닫기 핸들러
  const handleCloseOCR = (result?: IDCardOCRResult) => {
    if (ocrState.callbackId) {
      if (result) {
        const { isValid, ...rest } = result;
        if (isValid) {
          sendResponse(ocrState.callbackId, rest);
        } else {
          sendResponse(ocrState.callbackId, {
            error: "OCR 결과가 유효하지 않습니다.",
          });
        }
      } else {
        sendResponse(ocrState.callbackId, { error: "OCR이 취소되었습니다." });
      }
    }

    setOcrState({
      ...ocrState,
      visible: false,
      callbackId: "",
    });
  };

  // 스크린 컨트롤러 생성
  const screenController: ScreenController = {
    showCamera: (id: string) => {
      setCameraState({
        visible: true,
        callbackId: id,
      });
    },
    showOCR: (id: string, options?: OCRPayload) => {
      setOcrState({
        visible: true,
        callbackId: id,
        options: {
          documentType: "ID_CARD",
          ...options,
        },
      });
    },
  };

  return (
    <NativeScreenContext.Provider value={{ screenController, sendResponse }}>
      {children}

      {/* 카메라 모달 */}
      <CameraModal
        visible={cameraState.visible}
        onClose={() => handleCloseCamera()}
        onCapture={handleCloseCamera}
      />

      {/* OCR 모달 */}
      <OCRModal
        visible={ocrState.visible}
        onClose={() => handleCloseOCR()}
        onComplete={handleCloseOCR}
        options={ocrState.options}
      />
    </NativeScreenContext.Provider>
  );
};

export default NativeScreenManager;
