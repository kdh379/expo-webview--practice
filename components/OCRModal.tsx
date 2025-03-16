import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  Dimensions,
} from "react-native";

import { extractIDCardInfo, preprocessImage } from "../services/openai";

import CameraModal from "./CameraModal";

import type { CameraPictureOptions } from "expo-camera";

// 신분증 가이드라인 크기 계산
const { width } = Dimensions.get("window");
// 신분증 비율 (가로:세로 = 8.5:5.4)
const ID_CARD_RATIO = 8.5 / 5.4;
// 가로 모드로 변경
const GUIDE_WIDTH = width * 0.7; // 화면 너비의 70% ( Expo-Camera는 광각만 지원하여, 적당히 거리를 두고 찍어야함 )
const GUIDE_HEIGHT = GUIDE_WIDTH / ID_CARD_RATIO;

// 신분증 OCR을 위한 최적화된 카메라 옵션
const OPTIMIZED_CAMERA_OPTIONS: Partial<CameraPictureOptions> = {
  base64: true,
  quality: 0.5,
  imageType: "jpg", // JPEG 형식 사용
  exif: false, // EXIF 데이터 제외
  skipProcessing: true, // 이미지 처리 건너뛰기
};

interface OCRModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (result: IDCardOCRResult) => void;
  options?: OCRPayload;
}

const OCRModal: React.FC<OCRModalProps> = ({
  visible,
  onClose,
  onComplete,
  options,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    "idle" | "cropping" | "analyzing"
  >("idle");

  // 카메라로 사진 촬영 후 처리
  const handleCapture = async (capturedPhoto: CameraResult) => {
    setIsProcessing(true);
    setProcessingStep("cropping");

    try {
      // 이미지 전처리 (신분증 비율에 맞게 크롭)
      const processedImageBase64 = await preprocessImage(
        capturedPhoto.uri,
        capturedPhoto.base64?.split(",")[1],
      );

      setProcessingStep("analyzing");

      // OpenAI API를 사용하여 신분증 정보 추출
      const result = await extractIDCardInfo(processedImageBase64);

      // 결과 반환
      onComplete(result);
    } catch (err) {
      console.error("OCR 처리 오류:", err);
      // 오류 발생 시 빈 결과 반환
      onComplete({
        isValid: false,
        confidence: 0,
        error: err instanceof Error ? err.message : "알 수 없는 오류",
        imageBase64: capturedPhoto.base64?.split(",")[1] || "",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("idle");
      onClose();
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setIsProcessing(false);
    setProcessingStep("idle");
    onClose();
  };

  if (isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>
          {processingStep === "cropping"
            ? "신분증 이미지를 처리 중입니다..."
            : "신분증 정보를 분석 중입니다..."}
        </Text>
        <Text style={styles.loadingSubText}>
          {processingStep === "cropping"
            ? "이미지를 신분증 크기에 맞게 조정 중입니다."
            : "신분증 정보를 읽고 있습니다. 잠시만 기다려주세요."}
        </Text>
      </View>
    );
  }

  // 문서 타입에 따른 안내 메시지
  const getDocumentTypeMessage = () => {
    return options?.documentType === "ID_CARD"
      ? "주민등록증을 사각형 안에 맞춰주세요"
      : "운전면허증을 사각형 안에 맞춰주세요";
  };

  return (
    <CameraModal
      visible={visible && !isProcessing}
      onClose={handleClose}
      onCapture={handleCapture}
      cameraOptions={{
        ...OPTIMIZED_CAMERA_OPTIONS,
        quality: options?.quality || OPTIMIZED_CAMERA_OPTIONS.quality,
      }}
    >
      <View style={styles.mainContainer}>
        <View style={styles.guideContainer}>
          <View style={styles.idCardGuide} />
        </View>

        <View style={styles.helpTextContainer}>
          <Text style={styles.helpText}>{getDocumentTypeMessage()}</Text>
          <Text style={styles.guideSubText}>
            신분증 전체가 테두리 안에 들어가도록 해주세요
          </Text>
          <Text style={styles.guideSubText}>
            초점이 맞으면 촬영 버튼을 눌러주세요
          </Text>
        </View>
      </View>
    </CameraModal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1000,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  loadingSubText: {
    color: "white",
    fontSize: 12,
    marginTop: 5,
    opacity: 0.8,
    textAlign: "center",
    maxWidth: "80%",
  },
  mainContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  guideContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  idCardGuide: {
    width: GUIDE_WIDTH,
    height: GUIDE_HEIGHT,
    borderWidth: 4,
    borderColor: "#00BFFF",
    borderRadius: 12,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  guideText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 4,
    textAlign: "center",
    marginBottom: 8,
  },
  guideSubText: {
    color: "white",
    fontSize: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 6,
    borderRadius: 4,
    textAlign: "center",
    marginTop: 4,
  },
  helpTextContainer: {
    position: "absolute",
    top: 80,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },
  helpText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
});

export default OCRModal;
