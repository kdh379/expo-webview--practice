import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  Dimensions,
  Vibration,
  Animated,
  Alert,
  Platform,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { useFrameProcessor, runAtTargetFps } from "react-native-vision-camera";
import { Worklets, useSharedValue } from "react-native-worklets-core";
import {
  detect,
  initLicense,
} from "vision-camera-dynamsoft-document-normalizer";

import { extractIDCardInfo, preprocessImage } from "../services/openai";

import VisionCameraModal from "./VisionCameraModal";

import type { Camera } from "react-native-vision-camera";
import type { DetectedQuadResult } from "vision-camera-dynamsoft-document-normalizer";

// 신분증 가이드라인 크기 계산
const { width } = Dimensions.get("window");
// 신분증 비율 (가로:세로 = 8.5:5.4)
const ID_CARD_RATIO = 8.5 / 5.4;
// 가로 모드로 변경
const GUIDE_WIDTH = width * 0.7;
const GUIDE_HEIGHT = GUIDE_WIDTH / ID_CARD_RATIO;

// 프레임 처리 주기 (모든 프레임을 분석하지 않고 일정 간격으로 처리)
const FRAME_PROCESSOR_FPS = 5;
// 문서 인식 임계값
const CONFIDENCE_THRESHOLD = 85;
// 문서 감지 유지 시간 (자동 캡처 전 지연 시간)
const DETECTION_HOLD_TIME = 1500; // 1.5초
// 안정성 검사를 위한 IOU(Intersection Over Union) 임계값
const STABILITY_IOU_THRESHOLD = 0.9;
// 안정성 검사를 위해 유지할 이전 프레임 수
const STABILITY_FRAME_COUNT = 3;

interface OCRModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (result: IDCardOCRResult) => void;
  options?: OCRPayload;
}

// 사각형 간 IOU(Intersection Over Union) 계산 함수
function intersectionOverUnion(
  points1: { x: number; y: number }[],
  points2: { x: number; y: number }[],
) {
  if (!points1 || !points2 || points1.length !== 4 || points2.length !== 4) {
    return 0;
  }

  // 간단한 사각형 근사를 위해 최소/최대 x,y 값 계산
  const getBounds = (points: { x: number; y: number }[]) => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const pt of points) {
      minX = Math.min(minX, pt.x);
      minY = Math.min(minY, pt.y);
      maxX = Math.max(maxX, pt.x);
      maxY = Math.max(maxY, pt.y);
    }

    return { minX, minY, maxX, maxY };
  };

  const bounds1 = getBounds(points1);
  const bounds2 = getBounds(points2);

  // 교차 영역 계산
  const x_overlap = Math.max(
    0,
    Math.min(bounds1.maxX, bounds2.maxX) - Math.max(bounds1.minX, bounds2.minX),
  );
  const y_overlap = Math.max(
    0,
    Math.min(bounds1.maxY, bounds2.maxY) - Math.max(bounds1.minY, bounds2.minY),
  );
  const intersection = x_overlap * y_overlap;

  // 두 사각형의 영역 계산
  const area1 = (bounds1.maxX - bounds1.minX) * (bounds1.maxY - bounds1.minY);
  const area2 = (bounds2.maxX - bounds2.minX) * (bounds2.maxY - bounds2.minY);

  // 합집합 영역 계산 (전체 영역 - 교차 영역)
  const union = area1 + area2 - intersection;

  // IOU 계산
  return intersection / union;
}

// 1초 대기 함수
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const license =
  "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="; //one-day public trial

const VisionOCRModal: React.FC<OCRModalProps> = ({
  visible,
  onClose,
  onComplete,
  options,
}) => {
  const camera = useRef<Camera>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<
    "idle" | "cropping" | "analyzing"
  >("idle");

  // 신분증 감지 관련 상태
  const [cardDetected, setCardDetected] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [detectionResults, setDetectionResults] = useState<
    DetectedQuadResult[]
  >([]);
  const [pointsText, setPointsText] = useState("default");

  // 공유값 (워크렛과 메인 스레드 간)
  const frameWidth = useSharedValue(1080);
  const frameHeight = useSharedValue(1920);
  const takenShared = useSharedValue(false);
  const _viewBox = useSharedValue("0 0 1080 1920");

  // 안정성 검사를 위한 이전 감지 결과 저장
  const previousResults = useRef<DetectedQuadResult[]>([]);
  const autoCapture = true; // 구현 단순화를 위해 항상 활성화
  const detectionTimer = useRef<NodeJS.Timeout | null>(null);

  // 애니메이션 값
  const confidenceAnimValue = useRef(new Animated.Value(0)).current;
  const borderPulseAnim = useRef(new Animated.Value(1)).current;
  const polygonOpacityAnim = useRef(new Animated.Value(0)).current;
  const polygonScaleAnim = useRef(new Animated.Value(0.95)).current;

  // 워크렛에서 메인 스레드로 함수 전달
  const convertAndSetResults = (results: DetectedQuadResult[]) => {
    if (results && results.length > 0) {
      setDetectionResults(results);
      const confidence = results[0].confidenceAsDocumentBoundary || 0;
      setDetectionConfidence(confidence);

      // 포인트 데이터 업데이트
      const location = results[0].location;
      if (location && location.points) {
        const pointsData = location.points
          .map((p) => `${p.x},${p.y}`)
          .join(" ");
        setPointsText(pointsData);
      }

      if (confidence > CONFIDENCE_THRESHOLD && !cardDetected) {
        handleCardDetection(confidence);
      } else if (confidence > CONFIDENCE_THRESHOLD) {
        // 이미 감지 상태에서 신뢰도 업데이트
        updateConfidence(confidence);
      } else if (cardDetected) {
        // 신뢰도가 낮아져 감지 상태 해제
        resetCardDetection();
      }
    }
  };

  const convertAndSetResultsJS = Worklets.createRunOnJS(convertAndSetResults);

  const updateViewBox = () => {
    const viewBox = `0 0 ${frameWidth.value} ${frameHeight.value}`;
    _viewBox.value = viewBox;
  };

  const updateViewBoxJS = Worklets.createRunOnJS(updateViewBox);

  useEffect(() => {
    (async () => {
      const result = await initLicense(license);
      console.log("License valid: ", result);
      if (result === false) {
        Alert.alert("DDN", "License invalid");
      }
    })();

    // 펄스 애니메이션 시작
    startPulseAnimation();

    return () => {
      // 컴포넌트 언마운트 시 타이머 정리
      if (detectionTimer.current) {
        clearTimeout(detectionTimer.current);
      }
    };
  }, []);

  // 감지 결과 변경 시 안정성 검사
  useEffect(() => {
    if (detectionResults.length > 0) {
      checkIfSteady();
    }
  }, [detectionResults]);

  // 펄스 애니메이션 함수
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(borderPulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  // 신분증 감지 프레임 프로세서
  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";

    if (takenShared.value === false) {
      runAtTargetFps(FRAME_PROCESSOR_FPS, () => {
        "worklet";
        try {
          const results = detect(frame);

          if (results && Array.isArray(results) && results.length > 0) {
            frameWidth.value = frame.width;
            frameHeight.value = frame.height;
            convertAndSetResultsJS(results);
            updateViewBoxJS();
          }
        } catch (error) {
          console.log("프레임 처리 오류:", error);
        }
      });
    }
  }, []);

  // 안정성 검사 함수
  const checkIfSteady = () => {
    if (detectionResults.length === 0) return;

    const result = detectionResults[0];

    if (previousResults.current.length >= STABILITY_FRAME_COUNT - 1) {
      previousResults.current.push(result);

      if (steady()) {
        capturePhoto();
      } else {
        // 안정적이지 않으면 가장 오래된 결과 제거
        previousResults.current.shift();
      }
    } else {
      // 아직 충분한 프레임이 쌓이지 않았으므로 추가
      previousResults.current.push(result);
    }
  };

  // 안정성 확인 함수
  const steady = () => {
    if (previousResults.current.length < STABILITY_FRAME_COUNT) return false;

    // 모든 프레임 쌍에 대해 IOU 계산
    for (let i = 0; i < previousResults.current.length; i++) {
      for (let j = i + 1; j < previousResults.current.length; j++) {
        const iou = intersectionOverUnion(
          previousResults.current[i].location.points,
          previousResults.current[j].location.points,
        );

        if (iou < STABILITY_IOU_THRESHOLD) {
          return false;
        }
      }
    }

    return true;
  };

  // 신분증 감지 처리
  const handleCardDetection = (confidence: number) => {
    // 최초 감지 시 진동 피드백
    Vibration.vibrate(100);
    setCardDetected(true);

    // 폴리곤 애니메이션 시작
    Animated.parallel([
      Animated.timing(polygonOpacityAnim, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(polygonScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 신뢰도 애니메이션 시작
    Animated.timing(confidenceAnimValue, {
      toValue: confidence / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // 자동 캡처 타이머 설정 (안정성 확인 방식에서는 불필요할 수 있음)
    if (autoCapture && !detectionTimer.current) {
      detectionTimer.current = setTimeout(() => {
        capturePhoto();
      }, DETECTION_HOLD_TIME);
    }
  };

  // 신뢰도 업데이트
  const updateConfidence = (confidence: number) => {
    // 신뢰도 애니메이션 업데이트
    Animated.timing(confidenceAnimValue, {
      toValue: confidence / 100,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  // 신분증 감지 상태 초기화
  const resetCardDetection = useCallback(() => {
    setCardDetected(false);
    setDetectionConfidence(0);
    previousResults.current = [];

    // 애니메이션 초기화
    Animated.parallel([
      Animated.timing(confidenceAnimValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(polygonOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(polygonScaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 타이머 초기화
    if (detectionTimer.current) {
      clearTimeout(detectionTimer.current);
      detectionTimer.current = null;
    }
  }, [confidenceAnimValue, polygonOpacityAnim, polygonScaleAnim]);

  // 사진 촬영
  const capturePhoto = useCallback(async () => {
    if (!isProcessing && cardDetected && camera.current) {
      // 촬영 중인 상태로 설정
      setIsProcessing(true);
      takenShared.value = true;

      // 타이머 초기화
      if (detectionTimer.current) {
        clearTimeout(detectionTimer.current);
        detectionTimer.current = null;
      }

      try {
        // 성공적인 감지 알림 (사용자에게 피드백)
        Vibration.vibrate([0, 100, 100, 100]);

        // 안정화를 위한 짧은 대기
        await sleep(500);

        // 사진 촬영
        const photo = await camera.current.takePhoto({
          flash: "off",
          // 품질 최적화 옵션은 라이브러리의 지원에 따라 다를 수 있음
        });

        // 안드로이드에서 회전 처리 (필요한 경우)
        if (Platform.OS === "android" && photo.metadata?.Orientation === 6) {
          console.log("bitmap rotation needed for Android");
          // 여기서 회전 처리가 필요하다면 추가
        }

        // 이미지 처리 시작
        handleCapturedPhoto({
          uri: `file://${photo.path}`,
          width: photo.width,
          height: photo.height,
          // base64는 필요한 경우 처리
        });
      } catch (error) {
        console.error("사진 촬영 오류:", error);
        setIsProcessing(false);
        takenShared.value = false;
        Alert.alert("오류", "사진 촬영 중 문제가 발생했습니다");
      }
    }
  }, [isProcessing, cardDetected]);

  // 카메라로 사진 촬영 후 처리
  const handleCapturedPhoto = async (capturedPhoto: CameraResult) => {
    setProcessingStep("cropping");

    try {
      // 감지된 좌표가 있다면 해당 영역으로 크롭
      let processedImageBase64;

      if (
        detectionResults.length > 0 &&
        cardDetected &&
        detectionConfidence > CONFIDENCE_THRESHOLD
      ) {
        // 감지된 영역 정보와 함께 이미지 전처리
        processedImageBase64 = await preprocessImage(
          capturedPhoto.uri,
          capturedPhoto.base64?.split(",")[1],
        );
      } else {
        // 기본 이미지 전처리 (신분증 비율에 맞게 크롭)
        processedImageBase64 = await preprocessImage(
          capturedPhoto.uri,
          capturedPhoto.base64?.split(",")[1],
        );
      }

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
      takenShared.value = false;
      onClose();
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    resetCardDetection();
    setIsProcessing(false);
    setProcessingStep("idle");
    takenShared.value = false;
    onClose();
  };

  // 문서 타입에 따른 안내 메시지
  const getDocumentTypeMessage = useCallback(() => {
    return options?.documentType === "ID_CARD"
      ? "주민등록증을 사각형 안에 맞춰주세요"
      : "운전면허증을 사각형 안에 맞춰주세요";
  }, [options?.documentType]);

  // 신분증 인식 가이드 색상 (인식률에 따라 변경)
  const guideColor = confidenceAnimValue.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: ["#00BFFF", "#FFAA00", "#00FF00"],
  });

  // 인식률 텍스트
  const confidenceText = useMemo(() => {
    if (!cardDetected) return "";
    return `인식률: ${Math.round(detectionConfidence)}%`;
  }, [cardDetected, detectionConfidence]);

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

  // Vision Camera Modal을 통한 신분증 스캔 UI
  return (
    <VisionCameraModal
      visible={visible && !isProcessing}
      onClose={handleClose}
      onCapture={handleCapturedPhoto}
      cameraOptions={{
        physicalDevices: ["wide-angle-camera", "ultra-wide-angle-camera"],
      }}
      frameProcessor={frameProcessor}
      cameraRef={camera}
    >
      <View style={styles.mainContainer}>
        {/* SVG 오버레이 - 감지된 문서 경계 표시 */}
        <Svg
          preserveAspectRatio="xMidYMid slice"
          style={StyleSheet.absoluteFill}
          viewBox={_viewBox.value}
        >
          {pointsText !== "default" && (
            <Animated.View
              style={{
                opacity: polygonOpacityAnim,
                transform: [{ scale: polygonScaleAnim }],
              }}
            >
              <Polygon
                points={pointsText}
                fill="#00FF00"
                stroke="#00DD00"
                strokeWidth="3"
                fillOpacity="0.3"
                strokeOpacity="0.8"
              />
            </Animated.View>
          )}
        </Svg>

        {/* 신분증 가이드 */}
        <View style={styles.guideContainer}>
          <Animated.View
            style={[
              styles.idCardGuide,
              {
                borderColor: guideColor,
                transform: [{ scale: cardDetected ? 1 : borderPulseAnim }],
              },
            ]}
          />
          {cardDetected && (
            <Animated.View
              style={[
                styles.detectedBadge,
                {
                  backgroundColor: confidenceAnimValue.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [
                      "rgba(0, 191, 255, 0.7)",
                      "rgba(255, 170, 0, 0.7)",
                      "rgba(0, 255, 0, 0.7)",
                    ],
                  }),
                },
              ]}
            >
              <Text style={styles.detectedText}>신분증 감지됨</Text>
            </Animated.View>
          )}
        </View>

        {/* 도움말 메시지 */}
        <View style={styles.helpTextContainer}>
          <Text style={styles.helpText}>{getDocumentTypeMessage()}</Text>
          {!cardDetected ? (
            <>
              <Text style={styles.guideSubText}>
                신분증 전체가 테두리 안에 들어가도록 해주세요
              </Text>
              <Text style={styles.guideSubText}>
                {autoCapture
                  ? "자동 촬영 모드: 켜짐"
                  : "초점이 맞으면 촬영 버튼을 눌러주세요"}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.guideSubText}>{confidenceText}</Text>
              <Text style={styles.guideSubText}>
                {autoCapture
                  ? "잠시 기다리시면 자동으로 촬영됩니다"
                  : "촬영 버튼을 눌러 캡처하세요"}
              </Text>
            </>
          )}
        </View>

        {/* 진행률 표시 UI */}
        {cardDetected && autoCapture && (
          <Animated.View
            style={[
              styles.progressContainer,
              {
                width: confidenceAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        )}
      </View>
    </VisionCameraModal>
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
    borderRadius: 12,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  detectedBadge: {
    position: "absolute",
    top: Dimensions.get("window").height / 2 - GUIDE_HEIGHT / 2 - 30,
    backgroundColor: "rgba(0, 255, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  detectedText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  progressContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    height: 6,
    backgroundColor: "#00FF00",
    borderRadius: 3,
  },
});

export default VisionOCRModal;
